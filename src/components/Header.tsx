import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Calendar, UserCheck, Stethoscope, Search, Activity, RotateCcw } from 'lucide-react';

export type ActiveTab = 'booking' | 'manage' | 'reception' | 'doctor';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { appointments, currentSimulatedDate, resetAllData } = useClinic();
  const [resetNotice, setResetNotice] = useState(false);

  const todayAppointments = appointments.filter((a) => a.date === currentSimulatedDate);
  const waitingCount = todayAppointments.filter((a) => a.status === 'Waiting').length;
  const confirmedCount = todayAppointments.filter((a) => a.status === 'Confirmed').length;

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu mẫu ban đầu?')) {
      resetAllData();
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 2500);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinic info */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('booking')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Phòng khám Đa khoa An Tâm</span>
              </div>
              <p className="text-xs text-slate-500">Hệ thống Đặt lịch trực tuyến (FR-01) & Tiếp nhận Check-in (FR-02)</p>
            </div>
          </div>

          {/* Action: Reset Button */}
          <div className="flex items-center space-x-2">
            {resetNotice && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-fade-in font-medium">
                ✓ Đã reset dữ liệu ban đầu
              </span>
            )}
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition font-medium cursor-pointer"
              title="Khôi phục lại dữ liệu mẫu mặc định ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'booking'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>FR-01: Đặt lịch trực tuyến</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>FR-01: Tra cứu & Quản lý lịch hẹn</span>
          </button>

          <button
            onClick={() => setActiveTab('reception')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap relative ${
              activeTab === 'reception'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>FR-02: Quầy tiếp nhận & Check-in</span>
            {confirmedCount > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-800 text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                {confirmedCount} chờ đến
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap relative ${
              activeTab === 'doctor'
                ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Hàng đợi Bác sĩ (Real-time)</span>
            {waitingCount > 0 && (
              <span className="ml-1.5 bg-emerald-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {waitingCount} đang chờ
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

