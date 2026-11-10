import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Appointment,
  Doctor,
  BookingFormData,
  WalkInFormData,
} from '../types';
import {
  DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_DATE,
  DEFAULT_SIMULATED_TIME,
  ALL_SLOTS,
} from '../data/mockData';
import {
  canCancelOrRescheduleOnline,
  shouldBeMarkedNoShow,
} from '../utils/timeUtils';

interface Suggestion {
  slots: string[];
  otherDoctors: Doctor[];
}

interface ClinicContextType {
  doctors: Doctor[];
  appointments: Appointment[];
  currentSimulatedTime: string;
  currentSimulatedDate: string;
  setCurrentSimulatedTime: (time: string) => void;
  setCurrentSimulatedDate: (date: string) => void;
  // Getters
  getSlotBookingsCount: (doctorId: string, date: string, timeSlot: string) => number;
  checkDuplicateBooking: (phone: string, specialty: string, date: string) => Appointment | undefined;
  getDoctorQueue: (doctorId: string) => Appointment[];
  // Actions
  bookOnlineAppointment: (data: BookingFormData) => {
    success: boolean;
    appointment?: Appointment;
    error?: string;
    suggestions?: Suggestion;
  };
  cancelAppointment: (
    id: string,
    reason?: string,
    forcedByReception?: boolean
  ) => { success: boolean; message: string };
  rescheduleAppointment: (
    id: string,
    newDate: string,
    newSlot: string,
    newStartTime: string,
    forcedByReception?: boolean
  ) => { success: boolean; message: string };
  checkInPatient: (
    id: string,
    idCard?: string,
    delayHandling?: 'interleaved' | 'reschedule_next',
    newSlot?: string,
    newStartTime?: string
  ) => { success: boolean; message: string; appointment?: Appointment };
  runAutoNoShowScan: () => { affectedCount: number; affectedIds: string[] };
  createWalkInAppointment: (data: WalkInFormData) => {
    success: boolean;
    appointment?: Appointment;
    message: string;
  };
  advanceDoctorQueue: (doctorId: string) => void;
  completeConsultation: (appointmentId: string) => void;
  toggleDoctorAvailability: (doctorId: string) => void;
  resetAllData: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

const STORAGE_KEY = 'antam_clinic_appointments_v1';
const STORAGE_DOCTORS = 'antam_clinic_doctors_v1';
const STORAGE_TIME = 'antam_clinic_time_v1';

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem(STORAGE_DOCTORS);
    return saved ? JSON.parse(saved) : DOCTORS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [currentSimulatedTime, setCurrentSimulatedTime] = useState<string>(() => {
    return localStorage.getItem(STORAGE_TIME) || DEFAULT_SIMULATED_TIME;
  });

  const [currentSimulatedDate, setCurrentSimulatedDate] = useState<string>(INITIAL_DATE);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DOCTORS, JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TIME, currentSimulatedTime);
  }, [currentSimulatedTime]);

  /**
   * Count active bookings for a doctor in a specific slot (max capacity is 2).
   * Active statuses are Confirmed, Waiting, In-Consultation, Completed, Late.
   * Cancelled and No-Show are released and do not count against capacity.
   */
  const getSlotBookingsCount = (doctorId: string, date: string, timeSlot: string): number => {
    return appointments.filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.date === date &&
        apt.timeSlot === timeSlot &&
        apt.status !== 'Cancelled' &&
        apt.status !== 'No-Show'
    ).length;
  };

  /**
   * Check if patient already has a pending or confirmed booking in the same specialty on the same day
   */
  const checkDuplicateBooking = (
    phone: string,
    specialty: string,
    date: string
  ): Appointment | undefined => {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    return appointments.find(
      (apt) =>
        apt.patientPhone.trim().replace(/\s+/g, '') === cleanPhone &&
        apt.specialty === specialty &&
        apt.date === date &&
        (apt.status === 'Confirmed' || apt.status === 'Waiting' || apt.status === 'Late')
    );
  };

  /**
   * FR-01: Book Online Appointment
   * Enforces 15-minute slot limit (max 2 patients / doctor / slot)
   * Concurrency & capacity check
   */
  const bookOnlineAppointment = (data: BookingFormData) => {
    const targetDoctor = doctors.find((d) => d.id === data.doctorId);
    if (!targetDoctor || !targetDoctor.isAvailable) {
      return {
        success: false,
        error: 'Bác sĩ hiện không khả dụng trong ngày này. Vui lòng chọn bác sĩ khác.',
      };
    }

    // 1. Check slot capacity
    const currentCount = getSlotBookingsCount(data.doctorId, data.date, data.timeSlot);
    if (currentCount >= 2) {
      // Find adjacent available slots for this doctor
      const availableSlotsForDoc = ALL_SLOTS.filter(
        (s) => getSlotBookingsCount(data.doctorId, data.date, s.time) < 2
      ).map((s) => s.time);

      // Find other doctors with the same specialty who have open slots
      const otherDoctors = doctors.filter(
        (d) =>
          d.id !== data.doctorId &&
          d.specialty === data.specialty &&
          d.isAvailable &&
          ALL_SLOTS.some((s) => getSlotBookingsCount(d.id, data.date, s.time) < 2)
      );

      return {
        success: false,
        error: `Rất tiếc, khung giờ ${data.timeSlot} của ${targetDoctor.name} vừa được đăng ký hết chỗ (đã đủ 2/2 bệnh nhân). Vui lòng chọn khung giờ khác!`,
        suggestions: {
          slots: availableSlotsForDoc.slice(0, 4),
          otherDoctors,
        },
      };
    }

    // 2. Generate unique appointment code e.g. AT-20261110-089
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const dateFormatted = data.date.replace(/-/g, '');
    const newId = `AT-${dateFormatted}-${randomSuffix}`;

    const newAppointment: Appointment = {
      id: newId,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone.trim(),
      patientDob: data.patientDob,
      patientIdCard: data.patientIdCard?.trim() || undefined,
      symptoms: data.symptoms.trim(),
      doctorId: data.doctorId,
      doctorName: targetDoctor.name,
      specialty: data.specialty,
      date: data.date,
      timeSlot: data.timeSlot,
      slotStartTime: data.slotStartTime,
      status: 'Confirmed',
      type: 'Online',
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    return {
      success: true,
      appointment: newAppointment,
    };
  };

  /**
   * Cancel Appointment
   * Online patients must cancel >= 30 minutes before appointment start time.
   * Receptionists can force-cancel if needed.
   */
  const cancelAppointment = (
    id: string,
    reason?: string,
    forcedByReception = false
  ) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) {
      return { success: false, message: 'Không tìm thấy lịch hẹn!' };
    }

    if (apt.status === 'Cancelled' || apt.status === 'No-Show' || apt.status === 'Completed') {
      return { success: false, message: `Lịch hẹn đang ở trạng thái "${apt.status}", không thể hủy!` };
    }

    if (!forcedByReception && apt.date === currentSimulatedDate) {
      const check = canCancelOrRescheduleOnline(apt.slotStartTime, currentSimulatedTime);
      if (!check.allowed) {
        return {
          success: false,
          message: `Đã quá thời hạn đổi/hủy trực tuyến (trước 30 phút). Khung giờ của bạn lúc ${apt.slotStartTime}, hiện tại là ${currentSimulatedTime} (chỉ còn ${check.minutesRemaining} phút). Vui lòng liên hệ trực tiếp số hotline 1900 6868 của phòng khám để được hỗ trợ.`,
        };
      }
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'Cancelled' as const,
              cancellationReason: reason || 'Bệnh nhân yêu cầu hủy',
              cancelledAt: currentSimulatedTime,
            }
          : a
      )
    );

    return {
      success: true,
      message: 'Hủy lịch hẹn thành công. Khung giờ khám đã được giải phóng.',
    };
  };

  /**
   * Reschedule Appointment
   * Must be >= 30 minutes before original slot time if done online.
   * Checks slot capacity on the new slot.
   */
  const rescheduleAppointment = (
    id: string,
    newDate: string,
    newSlot: string,
    newStartTime: string,
    forcedByReception = false
  ) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) {
      return { success: false, message: 'Không tìm thấy lịch hẹn!' };
    }

    if (!forcedByReception && apt.date === currentSimulatedDate) {
      const check = canCancelOrRescheduleOnline(apt.slotStartTime, currentSimulatedTime);
      if (!check.allowed) {
        return {
          success: false,
          message: `Đã quá thời hạn đổi lịch trực tuyến (trước 30 phút). Vui lòng liên hệ trực tiếp hotline 1900 6868 để được nhân viên tiếp nhận hỗ trợ.`,
        };
      }
    }

    // Check new slot capacity
    const currentCount = getSlotBookingsCount(apt.doctorId, newDate, newSlot);
    if (currentCount >= 2) {
      return {
        success: false,
        message: `Khung giờ mới ${newSlot} đã kín chỗ (2/2 bệnh nhân). Vui lòng chọn khung giờ khác!`,
      };
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              date: newDate,
              timeSlot: newSlot,
              slotStartTime: newStartTime,
              status: 'Confirmed' as const,
              notes: (a.notes ? a.notes + ' | ' : '') + `Đổi từ ${a.timeSlot} sang ${newSlot}`,
            }
          : a
      )
    );

    return {
      success: true,
      message: `Đổi lịch hẹn sang khung giờ ${newSlot} thành công! Khung giờ cũ ${apt.timeSlot} đã được mở lại.`,
    };
  };

  /**
   * FR-02: Check-in Patient at Reception Desk
   * Updates administrative info (CCCD/BHYT), detects delay (>15 mins),
   * transitions status to 'Waiting' and assigns queue number.
   */
  const checkInPatient = (
    id: string,
    idCard?: string,
    delayHandling?: 'interleaved' | 'reschedule_next',
    newSlot?: string,
    newStartTime?: string
  ) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) {
      return { success: false, message: 'Không tìm thấy lịch hẹn!' };
    }

    if (apt.status === 'Waiting' || apt.status === 'In-Consultation' || apt.status === 'Completed') {
      return { success: false, message: `Bệnh nhân đã được tiếp nhận trước đó (Trạng thái: ${apt.status}).` };
    }

    if (apt.status === 'Cancelled') {
      return { success: false, message: 'Lịch hẹn này đã bị hủy, không thể tiếp nhận!' };
    }

    // If rescheduling due to being late
    let assignedSlot = apt.timeSlot;
    let assignedStartTime = apt.slotStartTime;
    if (delayHandling === 'reschedule_next' && newSlot && newStartTime) {
      assignedSlot = newSlot;
      assignedStartTime = newStartTime;
    }

    // Calculate queue number for the doctor today
    const currentWaitingOrDoneForDoctor = appointments.filter(
      (a) =>
        a.doctorId === apt.doctorId &&
        a.date === apt.date &&
        (a.status === 'Waiting' || a.status === 'In-Consultation' || a.status === 'Completed')
    );
    const nextQueueNumber = currentWaitingOrDoneForDoctor.length + 1;

    let updatedApt: Appointment | undefined;

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const isInterleaved = delayHandling === 'interleaved';
          updatedApt = {
            ...a,
            patientIdCard: idCard?.trim() || a.patientIdCard,
            timeSlot: assignedSlot,
            slotStartTime: assignedStartTime,
            status: 'Waiting' as const,
            checkInTime: currentSimulatedTime,
            queueNumber: nextQueueNumber,
            isPriority: isInterleaved,
            notes:
              (a.notes ? a.notes + ' | ' : '') +
              (delayHandling === 'interleaved'
                ? 'Đến trễ: Tiếp nhận chế độ Chờ xen kẽ'
                : delayHandling === 'reschedule_next'
                ? `Đến trễ: Dời sang slot ${assignedSlot}`
                : 'Tiếp nhận đúng giờ'),
          };
          return updatedApt;
        }
        return a;
      })
    );

    return {
      success: true,
      message: `Tiếp nhận thành công! Bệnh nhân ${apt.patientName} có STT: ${nextQueueNumber} tại buồng khám của ${apt.doctorName}.`,
      appointment: updatedApt,
    };
  };

  /**
   * Run Auto No-Show Scanning (SC-03 3b & Rule 8.1)
   * Scans appointments for today where currentSimulatedTime > slotStartTime + 15 mins
   * and status is still 'Confirmed'. Transitions to 'No-Show' and frees the slot.
   */
  const runAutoNoShowScan = () => {
    const affectedIds: string[] = [];
    setAppointments((prev) =>
      prev.map((apt) => {
        if (
          apt.date === currentSimulatedDate &&
          apt.status === 'Confirmed' &&
          shouldBeMarkedNoShow(apt.slotStartTime, currentSimulatedTime)
        ) {
          affectedIds.push(apt.id);
          return {
            ...apt,
            status: 'No-Show' as const,
            notes: (apt.notes ? apt.notes + ' | ' : '') + `Tự động hủy do vắng mặt quá 15 phút (quét lúc ${currentSimulatedTime})`,
          };
        }
        return apt;
      })
    );

    return {
      affectedCount: affectedIds.length,
      affectedIds,
    };
  };

  /**
   * FR-02: Walk-In Patient Reception
   * Immediately registers an on-site walk-in patient into an available slot
   * and moves them directly to 'Waiting' status in doctor queue!
   */
  const createWalkInAppointment = (data: WalkInFormData) => {
    const targetDoctor = doctors.find((d) => d.id === data.doctorId);
    if (!targetDoctor || !targetDoctor.isAvailable) {
      return { success: false, message: 'Bác sĩ không khả dụng!' };
    }

    const currentCount = getSlotBookingsCount(data.doctorId, currentSimulatedDate, data.timeSlot);
    if (currentCount >= 2) {
      return {
        success: false,
        message: `Khung giờ ${data.timeSlot} đã đầy (2/2 bệnh nhân). Hãy chọn khung giờ hoặc slot vừa bị hủy No-Show khác!`,
      };
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const dateFormatted = currentSimulatedDate.replace(/-/g, '');
    const newId = `AT-${dateFormatted}-W${randomSuffix}`;

    const currentDoctorWaiting = appointments.filter(
      (a) =>
        a.doctorId === data.doctorId &&
        a.date === currentSimulatedDate &&
        (a.status === 'Waiting' || a.status === 'In-Consultation' || a.status === 'Completed')
    );
    const nextQueueNumber = currentDoctorWaiting.length + 1;

    const newApt: Appointment = {
      id: newId,
      patientName: data.patientName.trim(),
      patientPhone: data.patientPhone.trim(),
      patientDob: data.patientDob,
      patientIdCard: data.patientIdCard?.trim() || undefined,
      symptoms: data.symptoms.trim(),
      doctorId: data.doctorId,
      doctorName: targetDoctor.name,
      specialty: data.specialty,
      date: currentSimulatedDate,
      timeSlot: data.timeSlot,
      slotStartTime: data.slotStartTime,
      status: 'Waiting',
      type: 'Walk-in',
      createdAt: new Date().toISOString(),
      checkInTime: currentSimulatedTime,
      queueNumber: nextQueueNumber,
      notes: 'Bệnh nhân vãng lai tiếp nhận trực tiếp tại quầy',
    };

    setAppointments((prev) => [newApt, ...prev]);

    return {
      success: true,
      appointment: newApt,
      message: `Đã tiếp nhận bệnh nhân vãng lai ${newApt.patientName}! STT: ${nextQueueNumber} tại ${targetDoctor.room}.`,
    };
  };

  /**
   * Get queue for a specific doctor
   */
  const getDoctorQueue = (doctorId: string): Appointment[] => {
    return appointments
      .filter((a) => a.doctorId === doctorId && a.date === currentSimulatedDate)
      .sort((a, b) => {
        // Priority patients (interleaved) go first among Waiting
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return (a.queueNumber || 999) - (b.queueNumber || 999);
      });
  };

  /**
   * Doctor advances queue: calls patient into consultation
   */
  const advanceDoctorQueue = (doctorId: string) => {
    const queue = getDoctorQueue(doctorId);
    const nextWaiting = queue.find((a) => a.status === 'Waiting');
    if (!nextWaiting) return;

    setAppointments((prev) =>
      prev.map((a) => {
        // If there was another in-consultation, finish it first
        if (a.doctorId === doctorId && a.status === 'In-Consultation') {
          return { ...a, status: 'Completed' as const };
        }
        if (a.id === nextWaiting.id) {
          return { ...a, status: 'In-Consultation' as const };
        }
        return a;
      })
    );
  };

  /**
   * Doctor completes consultation
   */
  const completeConsultation = (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'Completed' as const } : a))
    );
  };

  /**
   * Emergency Doctor Absence (SC-04)
   */
  const toggleDoctorAvailability = (doctorId: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, isAvailable: !d.isAvailable } : d))
    );
  };

  /**
   * Reset all mock data to factory state
   */
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_DOCTORS);
    localStorage.removeItem(STORAGE_TIME);
    setAppointments(INITIAL_APPOINTMENTS);
    setDoctors(DOCTORS);
    setCurrentSimulatedTime(DEFAULT_SIMULATED_TIME);
    setCurrentSimulatedDate(INITIAL_DATE);
  };

  return (
    <ClinicContext.Provider
      value={{
        doctors,
        appointments,
        currentSimulatedTime,
        currentSimulatedDate,
        setCurrentSimulatedTime,
        setCurrentSimulatedDate,
        getSlotBookingsCount,
        checkDuplicateBooking,
        getDoctorQueue,
        bookOnlineAppointment,
        cancelAppointment,
        rescheduleAppointment,
        checkInPatient,
        runAutoNoShowScan,
        createWalkInAppointment,
        advanceDoctorQueue,
        completeConsultation,
        toggleDoctorAvailability,
        resetAllData,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return context;
};
