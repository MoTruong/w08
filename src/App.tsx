import React, { useState } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { Header, ActiveTab } from './components/Header';
import { BookingView } from './components/patient/BookingView';
import { ManageAppointmentView } from './components/patient/ManageAppointmentView';
import { ReceptionView } from './components/reception/ReceptionView';
import { DoctorQueueView } from './components/doctor/DoctorQueueView';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('booking');
  const [initialManageCode, setInitialManageCode] = useState('');
  const [initialDoctorId, setInitialDoctorId] = useState('doc-1');

  const handleNavigateToManage = (code: string) => {
    setInitialManageCode(code);
    setActiveTab('manage');
  };

  const handleNavigateToDoctorQueue = (docId: string) => {
    setInitialDoctorId(docId);
    setActiveTab('doctor');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Main App Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'booking' && (
          <BookingView onNavigateToManage={handleNavigateToManage} />
        )}
        {activeTab === 'manage' && (
          <ManageAppointmentView initialCode={initialManageCode} />
        )}
        {activeTab === 'reception' && (
          <ReceptionView onNavigateToDoctorQueue={handleNavigateToDoctorQueue} />
        )}
        {activeTab === 'doctor' && (
          <DoctorQueueView initialDoctorId={initialDoctorId} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            Hệ thống Quản lý Phòng khám Đa khoa An Tâm
          </p>
          <p className="mt-1">
            Triển khai 02 chức năng cốt lõi: <strong>FR-01 (Đặt lịch hẹn trực tuyến)</strong> & <strong>FR-02 (Tiếp nhận & Check-in tại quầy)</strong>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
};

export default App;
