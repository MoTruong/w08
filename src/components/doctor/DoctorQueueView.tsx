import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Stethoscope,
  User,
  Clock,
  CheckCircle2,
  Play,
} from 'lucide-react';

export const DoctorQueueView: React.FC<{ initialDoctorId?: string }> = ({
  initialDoctorId = 'doc-1',
}) => {
  const {
    doctors,
    getDoctorQueue,
    advanceDoctorQueue,
    completeConsultation,
    toggleDoctorAvailability,
  } = useClinic();

  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const queue = getDoctorQueue(selectedDoctorId);

  const currentConsulting = queue.find((a) => a.status === 'In-Consultation');
  const waitingPatients = queue.filter((a) => a.status === 'Waiting');
  const completedPatients = queue.filter((a) => a.status === 'Completed');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Title & Doctor Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Màn hình Bác sĩ: Hàng đợi ca trực (Thời gian thực)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Hàng đợi khám - {currentDoctor.name}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bệnh nhân check-in thành công từ Quầy tiếp nhận (FR-02) sẽ hiển thị lập tức tại đây với số thứ tự tương ứng.
          </p>
        </div>

        {/* Doctor Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {doctors.map((d) => {
            const isSelected = d.id === selectedDoctorId;
            const docQueue = getDoctorQueue(d.id);
            const waitCount = docQueue.filter((a) => a.status === 'Waiting').length;

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDoctorId(d.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{d.name.replace('BS. CKI ', '').replace('ThS. BS ', '').replace('BS. CKII ', '').replace('BS. ', '')}</span>
                {waitCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {waitCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctor Status Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={currentDoctor.avatar}
            alt={currentDoctor.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{currentDoctor.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {currentDoctor.specialty}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  currentDoctor.isAvailable
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {currentDoctor.isAvailable ? 'Đang trực khám' : 'Nghỉ đột xuất'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentDoctor.room} • {currentDoctor.experience}
            </p>
          </div>
        </div>

        {/* Doctor Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleDoctorAvailability(currentDoctor.id)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition ${
              currentDoctor.isAvailable
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Đánh dấu trạng thái ca trực"
          >
            {currentDoctor.isAvailable ? 'Bác sĩ báo nghỉ đột xuất' : 'Mở lại ca trực'}
          </button>
        </div>
      </div>

      {/* Main Queue Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Currently in Consultation */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span>
            <span>Bệnh nhân đang khám</span>
          </h3>

          {currentConsulting ? (
            <div className="bg-white rounded-2xl shadow-xs border-2 border-purple-400 p-6 space-y-5 bg-gradient-to-b from-purple-50/40 to-white">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  {currentConsulting.id}
                </span>
                <span className="text-xs font-bold bg-purple-600 text-white px-2.5 py-0.5 rounded-full">
                  Đang trong buồng khám
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500">Bệnh nhân</span>
                <h4 className="text-xl font-bold text-slate-900">{currentConsulting.patientName}</h4>
                <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                  <span>SĐT: <strong className="font-mono">{currentConsulting.patientPhone}</strong></span>
                  <span>NS: {currentConsulting.patientDob}</span>
                  {currentConsulting.patientIdCard && (
                    <span>CCCD: <strong className="font-mono">{currentConsulting.patientIdCard}</strong></span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-200 text-xs space-y-1">
                <span className="font-semibold text-purple-900 block">Triệu chứng & Lý do khám:</span>
                <p className="text-slate-700 italic">"{currentConsulting.symptoms}"</p>
              </div>

              {currentConsulting.notes && (
                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600">
                  <strong>Ghi chú tiếp nhận:</strong> {currentConsulting.notes}
                </div>
              )}

              <button
                onClick={() => completeConsultation(currentConsulting.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn tất lượt khám này</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 space-y-3">
              <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">Hiện chưa có bệnh nhân nào trong buồng khám</p>
              {waitingPatients.length > 0 ? (
                <button
                  onClick={() => advanceDoctorQueue(currentDoctor.id)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-sm inline-flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Gọi bệnh nhân tiếp theo (# {waitingPatients[0].queueNumber})</span>
                </button>
              ) : (
                <p className="text-xs text-slate-400">Chưa có bệnh nhân nào đang chờ ngoài sảnh</p>
              )}
            </div>
          )}

          {/* Quick Call Button if currently consulting */}
          {currentConsulting && waitingPatients.length > 0 && (
            <button
              onClick={() => advanceDoctorQueue(currentDoctor.id)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Gọi tiếp: {waitingPatients[0].patientName} (STT #{waitingPatients[0].queueNumber})</span>
            </button>
          )}
        </div>

        {/* Right Column: Waiting Queue (Real-Time List) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Hàng đợi đang chờ khám ngoài sảnh ({waitingPatients.length})</span>
            </h3>
            <span className="text-xs text-slate-500">Sắp xếp theo STT & Ưu tiên</span>
          </div>

          {waitingPatients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Hàng đợi đang trống</p>
              <p className="text-xs mt-1">Khi nhân viên bấm "Tiếp nhận/Check-in" tại Quầy (FR-02), bệnh nhân sẽ lập tức hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingPatients.map((apt, index) => (
                <div
                  key={apt.id}
                  className={`bg-white p-4 rounded-2xl border transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    apt.isPriority
                      ? 'border-orange-300 bg-orange-50/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Queue Number & Details */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm flex-shrink-0 ${
                        apt.isPriority
                          ? 'bg-orange-500 text-white'
                          : index === 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{apt.queueNumber || index + 1}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                        {apt.isPriority && (
                          <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                            Ưu tiên xen kẽ (Đến trễ)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          ({apt.id})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Hẹn lúc: <strong className="font-mono text-slate-700">{apt.timeSlot}</strong></span>
                        </span>
                        {apt.checkInTime && (
                          <span className="text-emerald-700 font-medium">
                            • Check-in lúc: {apt.checkInTime}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 italic mt-1 max-w-md truncate">
                        "{apt.symptoms}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center space-x-2 sm:self-center">
                    <button
                      onClick={() => advanceDoctorQueue(currentDoctor.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Play className="w-3 h-3" />
                      <span>Mời vào khám</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed today section */}
          {completedPatients.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Đã hoàn tất khám hôm nay ({completedPatients.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {completedPatients.map((apt) => (
                  <span
                    key={apt.id}
                    className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{apt.patientName} ({apt.timeSlot.split(' - ')[0]})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
