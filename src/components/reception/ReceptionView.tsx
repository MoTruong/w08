import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, DelayHandling, WalkInFormData } from '../../types';
import { SPECIALTIES, ALL_SLOTS } from '../../data/mockData';
import { isLateForCheckIn } from '../../utils/timeUtils';
import {
  Search,
  UserCheck,
  UserPlus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

export const ReceptionView: React.FC<{ onNavigateToDoctorQueue?: (docId: string) => void }> = ({
  onNavigateToDoctorQueue,
}) => {
  const {
    appointments,
    doctors,
    currentSimulatedTime,
    currentSimulatedDate,
    checkInPatient,
    runAutoNoShowScan,
    createWalkInAppointment,
    getSlotBookingsCount,
  } = useClinic();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('All');

  // Check-in Drawer / Modal state
  const [activeCheckInAppointment, setActiveCheckInAppointment] = useState<Appointment | null>(null);
  const [idCardInput, setIdCardInput] = useState('');
  const [delayHandlingChoice, setDelayHandlingChoice] = useState<DelayHandling>('interleaved');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('09:30 - 09:45');
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>('09:30');

  // Walk-in Modal state
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInSpecialty, setWalkInSpecialty] = useState(SPECIALTIES[0]);
  const [walkInDoctorId, setWalkInDoctorId] = useState('doc-1');
  const [walkInSlot, setWalkInSlot] = useState('08:30 - 08:45');
  const [walkInStartTime, setWalkInStartTime] = useState('08:30');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDob, setWalkInDob] = useState('1990-01-01');
  const [walkInIdCard, setWalkInIdCard] = useState('');
  const [walkInSymptoms, setWalkInSymptoms] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string; targetDocId?: string } | null>(null);

  // Today's appointments
  const todayAppointments = appointments.filter((a) => a.date === currentSimulatedDate);

  // Stats
  const totalToday = todayAppointments.length;
  const confirmedCount = todayAppointments.filter((a) => a.status === 'Confirmed').length;
  const waitingCount = todayAppointments.filter((a) => a.status === 'Waiting').length;
  const inConsultCount = todayAppointments.filter((a) => a.status === 'In-Consultation').length;
  const completedCount = todayAppointments.filter((a) => a.status === 'Completed').length;
  const noShowCount = todayAppointments.filter((a) => a.status === 'No-Show').length;

  // Filtered list
  const filteredAppointments = todayAppointments.filter((apt) => {
    // Search query matches: ID, Phone, or Name
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = query
      ? apt.id.toLowerCase().includes(query) ||
        apt.patientPhone.includes(query) ||
        apt.patientName.toLowerCase().includes(query)
      : true;

    const matchesStatus =
      selectedStatusFilter === 'All' ? true : apt.status === selectedStatusFilter;

    const matchesDoctor =
      selectedDoctorFilter === 'All' ? true : apt.doctorId === selectedDoctorFilter;

    return matchesQuery && matchesStatus && matchesDoctor;
  });

  const openCheckInModal = (apt: Appointment) => {
    setActiveCheckInAppointment(apt);
    setIdCardInput(apt.patientIdCard || '');
    setDelayHandlingChoice('interleaved');
  };

  const handleConfirmCheckIn = () => {
    if (!activeCheckInAppointment) return;

    const check = isLateForCheckIn(activeCheckInAppointment.slotStartTime, currentSimulatedTime);
    const delayOption = check.isLate ? delayHandlingChoice : undefined;

    const res = checkInPatient(
      activeCheckInAppointment.id,
      idCardInput,
      delayOption,
      delayOption === 'reschedule_next' ? rescheduleSlot : undefined,
      delayOption === 'reschedule_next' ? rescheduleStartTime : undefined
    );

    if (res.success) {
      setNotification({
        type: 'success',
        message: res.message,
        targetDocId: activeCheckInAppointment.doctorId,
      });
      setActiveCheckInAppointment(null);
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim() || !walkInSymptoms.trim()) {
      alert('Vui lòng điền đủ Tên, SĐT và Triệu chứng của bệnh nhân vãng lai.');
      return;
    }

    const payload: WalkInFormData = {
      specialty: walkInSpecialty,
      doctorId: walkInDoctorId,
      timeSlot: walkInSlot,
      slotStartTime: walkInStartTime,
      patientName: walkInName,
      patientPhone: walkInPhone,
      patientDob: walkInDob,
      patientIdCard: walkInIdCard,
      symptoms: walkInSymptoms,
    };

    const res = createWalkInAppointment(payload);
    if (res.success) {
      setNotification({
        type: 'success',
        message: res.message,
        targetDocId: walkInDoctorId,
      });
      setIsWalkInModalOpen(false);
      // Reset form
      setWalkInName('');
      setWalkInPhone('');
      setWalkInSymptoms('');
      setWalkInIdCard('');
    } else {
      alert(res.message);
    }
  };

  const handleScanNoShow = () => {
    const result = runAutoNoShowScan();
    if (result.affectedCount > 0) {
      setNotification({
        type: 'warning',
        message: `Đã tự động chuyển ${result.affectedCount} lịch hẹn quá 15 phút sang trạng thái "Vắng mặt (No-Show)" và giải phóng khung giờ.`,
      });
    } else {
      setNotification({
        type: 'success',
        message: 'Hiện không có lịch hẹn nào quá 15 phút chưa check-in.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>FR-02: Tiếp nhận và Check-in bệnh nhân tại quầy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bàn tiếp nhận trung tâm ca trực</h1>
          <p className="text-sm text-slate-600 mt-1">
            02 nhân viên tiếp nhận tra cứu lịch theo Mã hẹn/SĐT, kiểm tra đối chiếu thông tin hành chính, phát hiện đến trễ và đẩy bệnh nhân vào buồng khám bác sĩ.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleScanNoShow}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm transition flex items-center space-x-1.5"
            title="Tự động hủy các lịch quá 15 phút chưa check-in và giải phóng khung giờ"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Quét vắng mặt (No-Show)</span>
          </button>

          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tiếp nhận vãng lai (Walk-in)</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Tổng ca hôm nay</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalToday}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Chờ đến check-in</span>
          <span className="text-2xl font-bold text-amber-800 mt-1 block">{confirmedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Đang chờ khám</span>
          <span className="text-2xl font-bold text-emerald-800 mt-1 block">{waitingCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">Đang trong phòng</span>
          <span className="text-2xl font-bold text-purple-800 mt-1 block">{inConsultCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Hoàn tất khám</span>
          <span className="text-2xl font-bold text-blue-800 mt-1 block">{completedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block">Vắng mặt (No-Show)</span>
          <span className="text-2xl font-bold text-red-800 mt-1 block">{noShowCount}</span>
        </div>
      </div>

      {/* Success / Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{notification.message}</span>
          </div>
          {notification.targetDocId && onNavigateToDoctorQueue && (
            <button
              onClick={() => onNavigateToDoctorQueue(notification.targetDocId!)}
              className="ml-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1"
            >
              <span>Xem buồng khám bác sĩ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Quick search input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tra cứu nhanh theo Mã hẹn (AT-..), SĐT hoặc Họ tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="All">Tất cả trạng thái ({totalToday})</option>
              <option value="Confirmed">Đã xác nhận (chờ đến)</option>
              <option value="Waiting">Đang chờ khám (đã check-in)</option>
              <option value="In-Consultation">Đang khám</option>
              <option value="Completed">Đã khám xong</option>
              <option value="No-Show">Vắng mặt (No-Show)</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Doctor filter */}
          <div className="md:col-span-4">
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="All">Tất cả 06 Bác sĩ</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 text-base">Danh sách tiếp nhận trong ngày</h2>
            <span className="text-xs text-slate-500">({filteredAppointments.length} bản ghi)</span>
          </div>
          <span className="text-xs text-slate-400">Giờ hiện tại: <strong className="text-emerald-700 font-mono">{currentSimulatedTime}</strong></span>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Không tìm thấy lịch hẹn phù hợp</p>
            <p className="text-xs mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="py-3 px-4">Mã hẹn / Loại</th>
                  <th className="py-3 px-4">Bệnh nhân</th>
                  <th className="py-3 px-4">Khung giờ hẹn</th>
                  <th className="py-3 px-4">Bác sĩ & Phòng</th>
                  <th className="py-3 px-4">Triệu chứng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác tiếp nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt) => {
                  const lateCheck = isLateForCheckIn(apt.slotStartTime, currentSimulatedTime);
                  const isLateArrival = apt.status === 'Confirmed' && lateCheck.isLate;

                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isLateArrival ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Code & Type */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{apt.id}</span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                            apt.type === 'Walk-in'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.type === 'Walk-in' ? 'Vãng lai' : 'Trực tuyến'}
                        </span>
                      </td>

                      {/* Patient info */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                        <span className="text-slate-500 font-mono">{apt.patientPhone}</span>
                        {apt.patientIdCard ? (
                          <span className="text-[10px] text-emerald-700 block font-mono">
                            CCCD: {apt.patientIdCard}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 block">
                            Chưa có CCCD/BHYT
                          </span>
                        )}
                      </td>

                      {/* Slot time */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 font-mono font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.timeSlot}</span>
                        </div>
                        {isLateArrival && (
                          <span className="inline-flex items-center space-x-1 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded mt-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Đến trễ {lateCheck.minutesLate}p</span>
                          </span>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-800 block">{apt.doctorName}</span>
                        <span className="text-slate-500">{apt.specialty}</span>
                      </td>

                      {/* Symptoms */}
                      <td className="py-3 px-4 max-w-[180px] truncate text-slate-600" title={apt.symptoms}>
                        {apt.symptoms}
                      </td>

                      {/* Status badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            apt.status === 'Confirmed'
                              ? isLateArrival
                                ? 'bg-red-100 text-red-800 ring-1 ring-red-400'
                                : 'bg-blue-100 text-blue-800'
                              : apt.status === 'Waiting'
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : apt.status === 'In-Consultation'
                              ? 'bg-purple-100 text-purple-800 font-bold'
                              : apt.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'No-Show'
                              ? 'bg-red-100 text-red-800 line-through'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {apt.status === 'Confirmed' && (isLateArrival ? 'Đến trễ (Late)' : 'Chờ đến')}
                          {apt.status === 'Waiting' && `Đang chờ (#${apt.queueNumber || '1'})`}
                          {apt.status === 'In-Consultation' && 'Đang khám'}
                          {apt.status === 'Completed' && 'Đã xong'}
                          {apt.status === 'No-Show' && 'Vắng mặt'}
                          {apt.status === 'Cancelled' && 'Đã hủy'}
                        </span>
                        {apt.isPriority && (
                          <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1 rounded block mt-0.5">
                            Ưu tiên xen kẽ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {apt.status === 'Confirmed' && (
                          <button
                            onClick={() => openCheckInModal(apt)}
                            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition shadow-xs flex items-center space-x-1 ml-auto ${
                              isLateArrival
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isLateArrival ? 'Xử lý trễ & Check-in' : 'Tiếp nhận / Check-in'}</span>
                          </button>
                        )}

                        {apt.status === 'Waiting' && (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Đã vào hàng đợi (#{apt.queueNumber})
                          </span>
                        )}

                        {apt.status === 'Completed' && (
                          <span className="text-[11px] text-slate-400">Hoàn tất</span>
                        )}

                        {apt.status === 'No-Show' && (
                          <span className="text-[11px] text-red-500">Slot đã giải phóng</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-In Action Modal / Drawer */}
      {activeCheckInAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tiếp nhận & Check-in tại quầy</h3>
                <span className="text-xs text-slate-500">Mã lịch hẹn: </span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {activeCheckInAppointment.id}
                </span>
              </div>
              <button
                onClick={() => setActiveCheckInAppointment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {/* Check late status */}
            {(() => {
              const lateCheck = isLateForCheckIn(
                activeCheckInAppointment.slotStartTime,
                currentSimulatedTime
              );

              return (
                <div className="space-y-4">
                  {lateCheck.isLate ? (
                    /* Red Badge & Delay handling choice (TC-RECP-02 / Flow 9a) */
                    <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-3">
                      <div className="flex items-start space-x-2">
                        <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                          Đến trễ (Late)
                        </span>
                        <div className="text-xs text-red-900">
                          <p className="font-bold">
                            Bệnh nhân đến trễ {lateCheck.minutesLate} phút so với khung giờ hẹn (
                            {activeCheckInAppointment.slotStartTime}).
                          </p>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            Quy chế phòng khám: Chọn 1 trong 2 phương án phân luồng để tránh ảnh hưởng các bệnh nhân đúng giờ:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer bg-white p-2.5 rounded-lg border border-red-200 hover:border-red-400">
                          <input
                            type="radio"
                            name="delayChoice"
                            checked={delayHandlingChoice === 'interleaved'}
                            onChange={() => setDelayHandlingChoice('interleaved')}
                            className="mt-0.5 text-emerald-600"
                          />
                          <div>
                            <strong className="block text-slate-900">Phương án 1: Chờ khám xen kẽ (Ưu tiên)</strong>
                            <span className="text-slate-500 text-[11px]">
                              Bác sĩ sẽ gọi bệnh nhân này ngay sau khi khám xong bệnh nhân đúng giờ kế tiếp.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer bg-white p-2.5 rounded-lg border border-red-200 hover:border-red-400">
                          <input
                            type="radio"
                            name="delayChoice"
                            checked={delayHandlingChoice === 'reschedule_next'}
                            onChange={() => setDelayHandlingChoice('reschedule_next')}
                            className="mt-0.5 text-emerald-600"
                          />
                          <div>
                            <strong className="block text-slate-900">Phương án 2: Dời sang khung giờ trống kế tiếp trong ca</strong>
                            <span className="text-slate-500 text-[11px]">
                              Xếp bệnh nhân vào một slot còn trống tiếp theo trong buổi trực.
                            </span>
                          </div>
                        </label>
                      </div>

                      {delayHandlingChoice === 'reschedule_next' && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                          <label className="font-semibold text-slate-700 block mb-1">
                            Chọn slot trống tiếp theo của {activeCheckInAppointment.doctorName}:
                          </label>
                          <select
                            value={rescheduleSlot}
                            onChange={(e) => {
                              setRescheduleSlot(e.target.value);
                              setRescheduleStartTime(e.target.value.split(' - ')[0]);
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            {ALL_SLOTS.filter(
                              (s) =>
                                getSlotBookingsCount(
                                  activeCheckInAppointment.doctorId,
                                  activeCheckInAppointment.date,
                                  s.time
                                ) < 2
                            ).map((s) => (
                              <option key={s.time} value={s.time}>
                                {s.time} (còn chỗ)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* On-time info */
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Bệnh nhân đến <strong>đúng giờ hẹn</strong> (Khung giờ:{' '}
                        {activeCheckInAppointment.timeSlot}).
                      </span>
                    </div>
                  )}

                  {/* Pre-registered Info Verification */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">Họ và tên:</span>
                        <strong className="text-slate-800 text-sm">
                          {activeCheckInAppointment.patientName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Số điện thoại:</span>
                        <strong className="text-slate-800 font-mono">
                          {activeCheckInAppointment.patientPhone}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ngày sinh:</span>
                        <span className="text-slate-800">{activeCheckInAppointment.patientDob}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Bác sĩ phụ trách:</span>
                        <strong className="text-emerald-700">
                          {activeCheckInAppointment.doctorName}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-slate-500 block">Triệu chứng ban đầu:</span>
                      <p className="italic text-slate-700">"{activeCheckInAppointment.symptoms}"</p>
                    </div>
                  </div>

                  {/* Administrative update: CCCD / BHYT (Requirement from FR-02) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Số thẻ CCCD / Thẻ BHYT (Đối chiếu & Bổ sung tại quầy):
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Nhập 12 số CCCD hoặc mã BHYT..."
                        value={idCardInput}
                        onChange={(e) => setIdCardInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInAppointment(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCheckIn}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-1"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Xác nhận Check-in</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Walk-In Reception Modal (Khám vãng lai tại quầy) */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tiếp nhận bệnh nhân vãng lai (Walk-in)</h3>
                  <p className="text-xs text-slate-500">Xếp vào slot còn trống hoặc slot vừa bị hủy do No-show</p>
                </div>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chuyên khoa:</label>
                  <select
                    value={walkInSpecialty}
                    onChange={(e) => {
                      setWalkInSpecialty(e.target.value);
                      const docs = doctors.filter((d) => d.specialty === e.target.value);
                      if (docs.length > 0) setWalkInDoctorId(docs[0].id);
                    }}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bác sĩ phụ trách:</label>
                  <select
                    value={walkInDoctorId}
                    onChange={(e) => setWalkInDoctorId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {doctors
                      .filter((d) => d.specialty === walkInSpecialty)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.room})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Chọn khung giờ trống (hoặc slot vừa mở lại):
                </label>
                <select
                  value={walkInSlot}
                  onChange={(e) => {
                    setWalkInSlot(e.target.value);
                    setWalkInStartTime(e.target.value.split(' - ')[0]);
                  }}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                >
                  {ALL_SLOTS.map((s) => {
                    const count = getSlotBookingsCount(walkInDoctorId, currentSimulatedDate, s.time);
                    const isAvailable = count < 2;
                    return (
                      <option key={s.time} value={s.time} disabled={!isAvailable}>
                        {s.time} - {isAvailable ? `Còn trống (${count}/2)` : 'Đã kín (2/2)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Họ và tên bệnh nhân <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="VD: Trần Đình Khang"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số điện thoại <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0981223344"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày sinh:</label>
                  <input
                    type="date"
                    value={walkInDob}
                    onChange={(e) => setWalkInDob(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Số CCCD / BHYT:</label>
                <input
                  type="text"
                  placeholder="Nhập số thẻ..."
                  value={walkInIdCard}
                  onChange={(e) => setWalkInIdCard(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lý do khám / Triệu chứng <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nhanh triệu chứng..."
                  value={walkInSymptoms}
                  onChange={(e) => setWalkInSymptoms(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition shadow-sm"
                >
                  Tiếp nhận vào khám ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
