import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Doctor, BookingFormData } from '../../types';
import { SPECIALTIES, MORNING_SLOTS, AFTERNOON_SLOTS, INITIAL_DATE } from '../../data/mockData';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Info,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export const BookingView: React.FC<{ onNavigateToManage?: (code: string) => void }> = ({
  onNavigateToManage,
}) => {
  const {
    doctors,
    getSlotBookingsCount,
    checkDuplicateBooking,
    bookOnlineAppointment,
    currentSimulatedDate,
  } = useClinic();

  // Form states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(SPECIALTIES[0]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');
  const [selectedDate, setSelectedDate] = useState<string>(currentSimulatedDate || INITIAL_DATE);
  const [selectedSlot, setSelectedSlot] = useState<string>('08:30 - 08:45');
  const [slotStartTime, setSlotStartTime] = useState<string>('08:30');

  // Patient inputs
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientDob, setPatientDob] = useState<string>('1998-08-15');
  const [patientIdCard, setPatientIdCard] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');

  // Modals / Feedback
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [conflictError, setConflictError] = useState<{
    message: string;
    suggestions?: { slots: string[]; otherDoctors: Doctor[] };
  } | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filtered doctors by specialty
  const availableDoctors = doctors.filter((d) => d.specialty === selectedSpecialty);
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || availableDoctors[0];

  // Auto switch doctor if selected doctor doesn't belong to current specialty
  const handleSpecialtyChange = (spec: string) => {
    setSelectedSpecialty(spec);
    const docs = doctors.filter((d) => d.specialty === spec);
    if (docs.length > 0) {
      setSelectedDoctorId(docs[0].id);
    }
  };

  const handleSelectSlot = (time: string, startTime: string) => {
    setSelectedSlot(time);
    setSlotStartTime(startTime);
    setConflictError(null);
  };

  const handleSubmitBooking = (e: React.FormEvent, skipDuplicateCheck = false) => {
    e.preventDefault();
    setValidationError(null);
    setConflictError(null);

    if (!patientName.trim()) {
      setValidationError('Vui lòng nhập Họ và tên bệnh nhân.');
      return;
    }
    if (!patientPhone.trim() || !/^[0-9]{9,11}$/.test(patientPhone.trim().replace(/\s+/g, ''))) {
      setValidationError('Vui lòng nhập Số điện thoại hợp lệ (9 - 11 chữ số).');
      return;
    }
    if (!patientDob) {
      setValidationError('Vui lòng nhập Ngày sinh.');
      return;
    }
    if (!symptoms.trim()) {
      setValidationError('Vui lòng mô tả triệu chứng hoặc lý do khám.');
      return;
    }

    // Check duplicate booking on same day & specialty (Flow 4a)
    if (!skipDuplicateCheck) {
      const existing = checkDuplicateBooking(patientPhone, selectedSpecialty, selectedDate);
      if (existing) {
        setDuplicateWarning(existing);
        return;
      }
    }

    const payload: BookingFormData = {
      specialty: selectedSpecialty,
      doctorId: selectedDoctorId,
      date: selectedDate,
      timeSlot: selectedSlot,
      slotStartTime: slotStartTime,
      patientName,
      patientPhone,
      patientDob,
      patientIdCard,
      symptoms,
    };

    const result = bookOnlineAppointment(payload);
    if (!result.success) {
      setConflictError({
        message: result.error || 'Khung giờ không khả dụng.',
        suggestions: result.suggestions,
      });
      return;
    }

    setConfirmedAppointment(result.appointment);
    setDuplicateWarning(null);
  };

  const handleResetForm = () => {
    setConfirmedAppointment(null);
    setPatientName('');
    setPatientPhone('');
    setSymptoms('');
    setPatientIdCard('');
    setConflictError(null);
    setDuplicateWarning(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          <Stethoscope className="w-4 h-4" />
          <span>FR-01: Đặt lịch hẹn khám bệnh trực tuyến</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Đăng ký lịch khám theo bác sĩ & khung giờ</h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Hệ thống áp dụng phân bổ <strong>slot 15 phút</strong> (tối đa <strong>02 bệnh nhân/slot</strong> cho mỗi bác sĩ) nhằm hạn chế dồn ứ bệnh nhân và kiểm soát tải khám tối đa 80–120 ca/ngày.
        </p>
      </div>

      {/* Confirmation Success View */}
      {confirmedAppointment ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Đặt lịch hẹn thành công!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Hệ thống đã tự động khóa khung giờ và lưu trữ bản ghi trạng thái <span className="font-semibold text-white underline">Đã xác nhận (Confirmed)</span>.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Appointment Code Banner */}
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-5 text-center">
              <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Mã lịch hẹn (Appointment Code)</span>
              <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-800 tracking-wider my-2">
                {confirmedAppointment.id}
              </div>
              <p className="text-xs text-slate-600">
                Vui lòng lưu lại mã này hoặc xuất trình mã QR tại Quầy tiếp nhận (FR-02) khi đến khám.
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Bệnh nhân</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.patientName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Số điện thoại</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.patientPhone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Bác sĩ phụ trách</span>
                <span className="font-semibold text-emerald-700">{confirmedAppointment.doctorName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Chuyên khoa & Buồng khám</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.specialty} ({currentDoctor?.room})</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ngày khám</span>
                <span className="font-semibold text-slate-800">{confirmedAppointment.date}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Khung giờ hẹn</span>
                <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  {confirmedAppointment.timeSlot}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 block">Triệu chứng ban đầu</span>
                <span className="text-slate-700 italic">"{confirmedAppointment.symptoms}"</span>
              </div>
            </div>

            {/* Simulated SMS preview */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-1 font-mono border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MÔ PHỎNG SMS GỬI VỀ SĐT: {confirmedAppointment.patientPhone}</span>
                </span>
                <span className="text-emerald-400">Đã gửi trong 15s</span>
              </div>
              <p className="text-slate-200">
                [PhongKham AnTam] QK {confirmedAppointment.patientName} da dat hen thanh cong ma: {confirmedAppointment.id}. Kham luc {confirmedAppointment.timeSlot} ngay {confirmedAppointment.date} voi {confirmedAppointment.doctorName}. Vui long den truoc 10p tai quay tiep nhan de check-in.
              </p>
            </div>

            {/* QR Code mockup */}
            <div className="flex items-center justify-center space-x-4 p-4 border border-slate-200 rounded-xl bg-white">
              <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                <QrCode className="w-14 h-14 text-slate-800" />
                <span className="text-[9px] font-mono text-slate-500 mt-1">Mã check-in</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Quy tắc xác thực & Tiếp nhận:</p>
                <p>• Đến đúng giờ tại Quầy tiếp nhận số 01 - 02.</p>
                <p>• Quá 15 phút chưa đến, lịch sẽ tự động hủy (No-Show) để nhường slot.</p>
                <p>• Đổi/Hủy lịch trực tuyến: Phải thực hiện trước giờ khám tối thiểu 30 phút.</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleResetForm}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition"
              >
                Đặt lịch hẹn khác
              </button>
              {onNavigateToManage && (
                <button
                  onClick={() => onNavigateToManage(confirmedAppointment.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>Xem / Quản lý lịch hẹn này</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Selection Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Specialty & Doctor */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">1</span>
                <h3 className="font-bold text-slate-900 text-base">Chọn Chuyên khoa & Bác sĩ</h3>
              </div>

              {/* Specialty pills */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Chuyên khoa</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecialtyChange(spec)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-medium transition ${
                        selectedSpecialty === spec
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor cards */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Bác sĩ khám</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-900 truncate">{doc.name}</p>
                          <p className="text-xs text-emerald-700 font-medium">{doc.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{doc.room}</p>
                          {!doc.isAvailable && (
                            <span className="inline-block mt-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Nghỉ đột xuất
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Date & 15-Minute Slot Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">2</span>
                  <h3 className="font-bold text-slate-900 text-base">Chọn Ngày & Khung giờ 15 phút</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Capacity info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>Quy tắc dung lượng slot:</strong> Mỗi khung giờ 15 phút chỉ nhận tối đa <strong>02 bệnh nhân</strong>. Khi đủ 2 người, slot sẽ tự động khóa và báo <em>Hết chỗ</em> để chống quá tải phòng khám.
                </p>
              </div>

              {/* Morning Slots */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ca Sáng (07:30 - 11:30)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MORNING_SLOTS.map((slot) => {
                    const count = getSlotBookingsCount(selectedDoctorId, selectedDate, slot.time);
                    const isFull = count >= 2;
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isFull}
                        onClick={() => handleSelectSlot(slot.time, slot.startTime)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${
                          isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:border-emerald-400 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold">{slot.startTime}</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                              isFull
                                ? 'bg-red-100 text-red-700 font-bold'
                                : isSelected
                                ? 'bg-emerald-500 text-white'
                                : count === 1
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isFull ? 'Hết chỗ (2/2)' : `${count}/2 chỗ`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon Slots */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Ca Chiều (13:30 - 16:30)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AFTERNOON_SLOTS.map((slot) => {
                    const count = getSlotBookingsCount(selectedDoctorId, selectedDate, slot.time);
                    const isFull = count >= 2;
                    const isSelected = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={isFull}
                        onClick={() => handleSelectSlot(slot.time, slot.startTime)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${
                          isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:border-emerald-400 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="font-mono text-xs font-semibold">{slot.startTime}</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                              isFull
                                ? 'bg-red-100 text-red-700 font-bold'
                                : isSelected
                                ? 'bg-emerald-500 text-white'
                                : count === 1
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {isFull ? 'Hết chỗ (2/2)' : `${count}/2 chỗ`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Patient Information Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 sticky top-24">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="font-bold text-slate-900 text-base">Thông tin bệnh nhân</h3>
              </div>

              {/* Selected Slot Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Khung giờ đã chọn:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedSlot}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Bác sĩ:</span>
                  <span className="font-medium text-slate-800">{currentDoctor?.name}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Ngày khám:</span>
                  <span className="font-medium text-slate-800">{selectedDate}</span>
                </div>
              </div>

              {/* Error messages */}
              {validationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Conflict / Concurrency Error Alert (SC-02 / TC-BOOK-02) */}
              {conflictError && (
                <div className="mb-5 p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">{conflictError.message}</span>
                  </div>

                  {conflictError.suggestions && (
                    <div className="pt-2 border-t border-amber-200/80 space-y-2">
                      <p className="font-medium text-amber-800">💡 Gợi ý khung giờ còn trống:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {conflictError.suggestions.slots.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(s);
                              setSlotStartTime(s.split(' - ')[0]);
                              setConflictError(null);
                            }}
                            className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1 rounded text-[11px] font-mono font-bold"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {conflictError.suggestions.otherDoctors.length > 0 && (
                        <div className="pt-1">
                          <p className="font-medium text-amber-800">Bác sĩ khác cùng chuyên khoa còn chỗ:</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {conflictError.suggestions.otherDoctors.map((doc) => (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDoctorId(doc.id);
                                  setConflictError(null);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded text-[11px] font-medium"
                              >
                                {doc.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Form inputs */}
              <form onSubmit={(e) => handleSubmitBooking(e, false)} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Họ và tên bệnh nhân <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="VD: 0912345678"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={patientDob}
                      onChange={(e) => setPatientDob(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Số thẻ CCCD / BHYT <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 079098001234 hoặc mã BHYT"
                    value={patientIdCard}
                    onChange={(e) => setPatientIdCard(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mô tả triệu chứng / Lý do khám <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Sốt 38.5 độ kèm đau họng, ho có đờm 2 ngày..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận đặt lịch hẹn</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal (Flow 4a) */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Trùng lặp thông tin đặt lịch</h3>
              <p className="text-xs text-slate-600 mt-2">
                Hệ thống phát hiện số điện thoại <strong>{patientPhone}</strong> đang có lịch hẹn chưa khám cùng chuyên khoa <strong>{selectedSpecialty}</strong> vào ngày hôm nay:
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 border border-slate-200">
              <p>• Mã hẹn hiện có: <strong className="font-mono text-emerald-800">{duplicateWarning.id}</strong></p>
              <p>• Bác sĩ: <strong>{duplicateWarning.doctorName}</strong></p>
              <p>• Khung giờ: <strong>{duplicateWarning.timeSlot}</strong></p>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Bạn có chắc chắn muốn tạo thêm lịch hẹn mới này không, hay muốn giữ lại lịch hiện tại?
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmitBooking(e, true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition"
              >
                Vẫn tiếp tục tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
