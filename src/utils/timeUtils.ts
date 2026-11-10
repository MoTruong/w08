/**
 * Helper to convert "HH:mm" to total minutes from start of day
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Returns difference in minutes between slot start time and current simulated time
 * positive: slot is in the future
 * negative: slot is in the past
 */
export function getMinutesUntilSlot(slotStartTime: string, currentSimulatedTime: string): number {
  return timeStringToMinutes(slotStartTime) - timeStringToMinutes(currentSimulatedTime);
}

/**
 * Check if the cancellation / reschedule is allowed (must be at least 30 minutes before slot start time)
 */
export function canCancelOrRescheduleOnline(slotStartTime: string, currentSimulatedTime: string): {
  allowed: boolean;
  minutesRemaining: number;
} {
  const diff = getMinutesUntilSlot(slotStartTime, currentSimulatedTime);
  return {
    allowed: diff >= 30,
    minutesRemaining: diff,
  };
}

/**
 * Check if patient is late for check-in (more than 15 minutes past slot start time)
 */
export function isLateForCheckIn(slotStartTime: string, currentSimulatedTime: string): {
  isLate: boolean;
  minutesLate: number;
} {
  const diff = timeStringToMinutes(currentSimulatedTime) - timeStringToMinutes(slotStartTime);
  return {
    isLate: diff > 15,
    minutesLate: Math.max(0, diff),
  };
}

/**
 * Check if appointment should be marked No-Show automatically
 * (still Confirmed and more than 15 minutes past slot start time)
 */
export function shouldBeMarkedNoShow(slotStartTime: string, currentSimulatedTime: string): boolean {
  const diff = timeStringToMinutes(currentSimulatedTime) - timeStringToMinutes(slotStartTime);
  return diff > 15;
}

/**
 * Format date nicely for Vietnamese display
 */
export function formatVNDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

