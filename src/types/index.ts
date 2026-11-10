export type AppointmentStatus =
  | 'Confirmed'       // Đã xác nhận (mới đặt từ FR-01)
  | 'Waiting'         // Đang chờ khám (đã check-in từ FR-02)
  | 'In-Consultation' // Đang khám trong buồng bác sĩ
  | 'Completed'       // Đã hoàn tất khám
  | 'Late'            // Đến trễ (quá 15 phút, đang xử lý)
  | 'No-Show'         // Đã hủy - Vắng mặt (quá 15 phút không check-in)
  | 'Cancelled';      // Đã hủy chủ động bởi bệnh nhân

export type AppointmentType = 'Online' | 'Walk-in';

export interface Doctor {
  id: string;
  name: string;
  title: string;          // BS. CKI, ThS. BS, etc.
  specialty: string;      // Nội tổng quát, Tim mạch, Nhi, etc.
  room: string;           // Phòng 101, Phòng 102...
  avatar: string;
  experience: string;
  isAvailable: boolean;   // Khả dụng hay nghỉ đột xuất
}

export interface TimeSlot {
  time: string;           // e.g. "08:00 - 08:15"
  startTime: string;      // e.g. "08:00"
  endTime: string;        // e.g. "08:15"
  capacity: number;       // Tối đa 2 bệnh nhân / slot
}

export interface Appointment {
  id: string;             // e.g. "AT-20261110-089"
  patientName: string;
  patientPhone: string;
  patientDob: string;     // YYYY-MM-DD
  patientIdCard?: string; // CCCD / BHYT
  symptoms: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;           // YYYY-MM-DD
  timeSlot: string;       // e.g. "08:00 - 08:15"
  slotStartTime: string;  // e.g. "08:00"
  status: AppointmentStatus;
  type: AppointmentType;
  createdAt: string;
  checkInTime?: string;
  queueNumber?: number;   // Số thứ tự khám trong ngày của bác sĩ
  isPriority?: boolean;   // Chờ xen kẽ nếu đến trễ
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface BookingFormData {
  specialty: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  slotStartTime: string;
  patientName: string;
  patientPhone: string;
  patientDob: string;
  patientIdCard?: string;
  symptoms: string;
}

export interface WalkInFormData {
  specialty: string;
  doctorId: string;
  timeSlot: string;
  slotStartTime: string;
  patientName: string;
  patientPhone: string;
  patientDob: string;
  patientIdCard?: string;
  symptoms: string;
}

export type DelayHandling = 'interleaved' | 'reschedule_next';

