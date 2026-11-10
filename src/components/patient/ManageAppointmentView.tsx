import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment } from '../../types';
import { ALL_SLOTS } from '../../data/mockData';
import { canCancelOrRescheduleOnline } from '../../utils/timeUtils';
import {
  Search,
  Calendar,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  QrCode,
} from 'lucide-react';

export const ManageAppointmentView: React.FC<{ initialCode?: string }> = ({ initialCode = '' }) => {
  const {
    appointments,
    currentSimulatedTime,
    cancelAppointment,
    rescheduleAppointment,
    getSlotBookingsCount,
  } = useClinic();

  const [searchCode, setSearchCode] = useState<string>(initialCode);
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [searchedAppointment, setSearchedAppointment] = useState<Appointment | null>(() => {
    if (initialCode) {
      return appointments.find((a) => a.id.toLowerCase() === initialCode.toLowerCase()) || null;
    }
    return null;
  });
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Bận việc đột xuất');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState('10:30 - 10:45');
  const [newStartTime, setNewStartTime] = useState('10:30');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setActionAlert(null);

    const codeClean = searchCode.trim().toLowerCase();
    const phoneClean = searchPhone.trim().replace(/\s+/g, '');

    if (!codeClean && !phoneClean) {
      setSearchError('Vui lòng nhập Mã lịch hẹn hoặc Số điện thoại để tra cứu.');
      return;
    }

    const found = appointments.find((a) => {
      const matchCode = codeClean ? a.id.toLowerCase() === codeClean : true;
      const matchPhone = phoneClean ? a.patientPhone.replace(/\s+/g, '') === phoneClean : true;
      return matchCode && matchPhone;
    });

    if (!found) {
      setSearchError('Không tìm thấy lịch hẹn phù hợp. Vui lòng kiểm tra lại Mã hẹn hoặc SĐT.');
      setSearchedAppointment(null);
      return;
    }

    setSearchedAppointment(found);
  };

  const handleConfirmCancel = () => {
    if (!searchedAppointment) return;
    const res = cancelAppointment(searchedAppointment.id, cancelReason, false);
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      // Update local state view
      const updated = appointments.find((a) => a.id === searchedAppointment.id);
      if (updated) setSearchedAppointment({ ...updated, status: 'Cancelled' });
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
    setIsCancelModalOpen(false);
  };

  const handleConfirmReschedule = () => {
    if (!searchedAppointment) return;
    const res = rescheduleAppointment(
      searchedAppointment.id,
      searchedAppointment.date,
      newSlot,
      newStartTime,
      false
    );
    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      setSearchedAppointment({
        ...searchedAppointment,
        timeSlot: newSlot,
        slotStartTime: newStartTime,
      });
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
    setIsRescheduleModalOpen(false);
  };

  // Check 30 mins rule status for current selected appointment
  const cancelRuleCheck = searchedAppointment
    ? canCancelOrRescheduleOnline(searchedAppointment.slotStartTime, currentSimulatedTime)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          <Calendar className="w-4 h-4" />
          <span>FR-01: Quản lý & Thay đổi lịch khám trực tuyến</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tra cứu / Đổi / Hủy lịch hẹn</h1>
        <p className="text-sm text-slate-600 mt-1">
          Bệnh nhân có quyền hủy hoặc dời lịch khám trực tuyến <strong>trước giờ khám tối thiểu 30 phút</strong>.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Mã lịch hẹn (Appointment Code)</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="VD: AT-20261110-001"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Số điện thoại đăng ký</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="VD: 0901234567"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center space-x-1.5 h-[38px]"
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu ngay</span>
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
            {searchError}
          </div>
        )}
      </div>

      {/* Action result notification */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start space-x-2 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* Search Result Card */}
      {searchedAppointment && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold font-mono text-slate-900">{searchedAppointment.id}</h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    searchedAppointment.status === 'Confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : searchedAppointment.status === 'Waiting'
                      ? 'bg-amber-100 text-amber-800'
                      : searchedAppointment.status === 'In-Consultation'
                      ? 'bg-purple-100 text-purple-800'
                      : searchedAppointment.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : searchedAppointment.status === 'No-Show'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {searchedAppointment.status === 'Confirmed' && 'Đã xác nhận'}
                  {searchedAppointment.status === 'Waiting' && 'Đang chờ khám'}
                  {searchedAppointment.status === 'In-Consultation' && 'Đang khám'}
                  {searchedAppointment.status === 'Completed' && 'Đã khám xong'}
                  {searchedAppointment.status === 'No-Show' && 'Vắng mặt (No-Show)'}
                  {searchedAppointment.status === 'Cancelled' && 'Đã hủy'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tạo lúc: {new Date(searchedAppointment.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>

            {/* Business Rule status badge */}
            {cancelRuleCheck && searchedAppointment.status === 'Confirmed' && (
              <div
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 ${
                  cancelRuleCheck.allowed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {cancelRuleCheck.allowed
                    ? `Còn ${cancelRuleCheck.minutesRemaining} phút trước giờ khám (Đủ điều kiện hủy/đổi trực tuyến)`
                    : `Chỉ còn ${cancelRuleCheck.minutesRemaining} phút (< 30 phút - Khóa hủy/đổi tự động)`}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info Col 1 & 2 */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Họ và tên</span>
                <span className="font-semibold text-slate-800">{searchedAppointment.patientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Số điện thoại</span>
                <span className="font-semibold text-slate-800">{searchedAppointment.patientPhone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ngày sinh</span>
                <span className="font-semibold text-slate-800">{searchedAppointment.patientDob}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">CCCD / BHYT</span>
                <span className="font-semibold text-slate-800">
                  {searchedAppointment.patientIdCard || '(Chưa cập nhật - bổ sung tại quầy)'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Bác sĩ phụ trách</span>
                <span className="font-semibold text-emerald-700">{searchedAppointment.doctorName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Chuyên khoa</span>
                <span className="font-semibold text-slate-800">{searchedAppointment.specialty}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ngày hẹn</span>
                <span className="font-semibold text-slate-800">{searchedAppointment.date}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Khung giờ hẹn</span>
                <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  {searchedAppointment.timeSlot}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 block">Triệu chứng đăng ký</span>
                <span className="text-slate-700 italic">"{searchedAppointment.symptoms}"</span>
              </div>
              {searchedAppointment.notes && (
                <div className="sm:col-span-2 text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">
                  <strong>Ghi chú hệ thống:</strong> {searchedAppointment.notes}
                </div>
              )}
            </div>

            {/* QR & Action Column */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <QrCode className="w-20 h-20 text-slate-800 mx-auto" />
                <span className="text-xs font-mono font-bold text-slate-700 block mt-2">
                  {searchedAppointment.id}
                </span>
                <span className="text-[10px] text-slate-500">Mã xuất trình check-in</span>
              </div>

              {/* Action buttons (Only for Confirmed) */}
              {searchedAppointment.status === 'Confirmed' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => setIsRescheduleModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi sang khung giờ khác</span>
                  </button>

                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-300 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Hủy lịch hẹn này</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center p-2 bg-slate-50 rounded-lg">
                  Lịch hẹn không còn ở trạng thái "Đã xác nhận", không thể thao tác đổi/hủy trực tuyến.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal (SC-03 Case B & 3a) */}
      {isCancelModalOpen && searchedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận hủy lịch khám</h3>
              <p className="text-xs text-slate-600 mt-1">
                Lịch hẹn: <strong className="font-mono">{searchedAppointment.id}</strong> lúc{' '}
                <strong>{searchedAppointment.timeSlot}</strong>
              </p>
            </div>

            {/* Check 30 minutes rule */}
            {cancelRuleCheck && !cancelRuleCheck.allowed ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
                <p className="font-bold flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Từ chối hủy trực tuyến (&lt; 30 phút)</span>
                </p>
                <p>
                  Theo quy chế, hệ thống chỉ cho phép hủy trực tuyến trước giờ khám tối thiểu <strong>30 phút</strong>. Hiện tại chỉ còn <strong>{cancelRuleCheck.minutesRemaining} phút</strong>.
                </p>
                <p className="font-semibold text-red-900 bg-red-100 p-2 rounded">
                  📞 Vui lòng gọi Hotline Phòng khám: <strong>1900 6868</strong> để được nhân viên hỗ trợ trực tiếp.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  ✓ Thời gian hủy hợp lệ (trước giờ khám &ge; 30 phút). Khung giờ này sẽ lập tức được giải phóng cho bệnh nhân khác đăng ký.
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Lý do hủy lịch:</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Bận việc đột xuất">Bận việc đột xuất</option>
                    <option value="Sức khỏe đã ổn định">Sức khỏe đã ổn định</option>
                    <option value="Đổi sang khám cơ sở khác">Đổi sang khám cơ sở khác</option>
                    <option value="Khác">Lý do khác</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition"
              >
                Đóng
              </button>
              {cancelRuleCheck?.allowed && (
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition"
                >
                  Xác nhận hủy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal (SC-03 Case A) */}
      {isRescheduleModalOpen && searchedAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Đổi sang khung giờ mới</h3>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            {/* Check 30 mins rule */}
            {cancelRuleCheck && !cancelRuleCheck.allowed ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-2">
                <p className="font-bold flex items-center space-x-1">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Không thể đổi lịch trực tuyến (&lt; 30 phút)</span>
                </p>
                <p>
                  Đã quá thời hạn đổi lịch trực tuyến (trước 30 phút). Vui lòng liên hệ trực tiếp hotline <strong>1900 6868</strong> để nhân viên tiếp nhận hỗ trợ dời lịch.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Bác sĩ: <strong>{searchedAppointment.doctorName}</strong> • Khung giờ hiện tại:{' '}
                  <span className="font-mono font-bold text-emerald-800">{searchedAppointment.timeSlot}</span>
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Chọn khung giờ mới còn chỗ:</label>
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                    {ALL_SLOTS.map((slot) => {
                      const count = getSlotBookingsCount(
                        searchedAppointment.doctorId,
                        searchedAppointment.date,
                        slot.time
                      );
                      const isFull = count >= 2 && slot.time !== searchedAppointment.timeSlot;
                      const isSelected = newSlot === slot.time;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={isFull}
                          onClick={() => {
                            setNewSlot(slot.time);
                            setNewStartTime(slot.startTime);
                          }}
                          className={`p-2 rounded-lg border text-xs text-center transition ${
                            isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                              : 'bg-white hover:border-blue-400 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="block font-mono font-medium">{slot.startTime}</span>
                          <span className="text-[10px] block opacity-80">
                            {isFull ? 'Hết chỗ' : `${count}/2`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition"
              >
                Đóng
              </button>
              {cancelRuleCheck?.allowed && (
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition"
                >
                  Xác nhận đổi giờ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
