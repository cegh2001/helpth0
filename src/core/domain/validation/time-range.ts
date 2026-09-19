const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function assertValidTimeRange(startTime: string, endTime: string): void {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw new Error('Time must be in HH:mm 24-hour format');
  }

  if (startTime === endTime) {
    throw new Error('Start time and end time must be different');
  }
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}