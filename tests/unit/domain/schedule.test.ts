import { describe, it, expect } from 'vitest';
import { WeeklySchedule } from '@/core/domain/entities/schedule.entity';

describe('WeeklySchedule Entity', () => {
  it('should create a valid weekly schedule entity', () => {
    const schedule = WeeklySchedule.create({
      doctorId: 'doc-123',
      dayOfWeek: 1, // Monday
      startTime: '08:00',
      endTime: '14:00',
    });

    expect(schedule.id).toBeDefined();
    expect(schedule.doctorId).toBe('doc-123');
    expect(schedule.dayOfWeek).toBe(1);
    expect(schedule.startTime).toBe('08:00');
    expect(schedule.endTime).toBe('14:00');
  });

  it('should throw an error if dayOfWeek is out of bounds (0-6)', () => {
    expect(() => {
      WeeklySchedule.create({
        doctorId: 'doc-123',
        dayOfWeek: 7,
        startTime: '08:00',
        endTime: '14:00',
      });
    }).toThrowError('Day of week must be between 0 (Sunday) and 6 (Saturday)');
  });

  it('should throw an error for invalid time format', () => {
    expect(() => {
      WeeklySchedule.create({
        doctorId: 'doc-123',
        dayOfWeek: 2,
        startTime: '8:00', // Invalid, needs leading zero
        endTime: '14:00',
      });
    }).toThrowError('Time must be in HH:mm 24-hour format');
  });

  it('should throw an error if endTime is not after startTime', () => {
    expect(() => {
      WeeklySchedule.create({
        doctorId: 'doc-123',
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '08:00',
      });
    }).toThrowError('End time must be after start time');

    expect(() => {
      WeeklySchedule.create({
        doctorId: 'doc-123',
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '10:00',
      });
    }).toThrowError('End time must be after start time');
  });
});
