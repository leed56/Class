import { AttendanceSession, AttendanceStudent } from '../models';

export const attendanceSessionSeed: AttendanceSession = {
  id: 'session-001',
  subject: 'Mathematics',
  grade: 9,
  medium: 'English',
  hall: 'Hall A',
  date: '15 June 2026',
  startTime: '10:30 AM',
  endTime: '12:00 PM',
  totalStudents: 38,
};

export const attendanceStudentsSeed: AttendanceStudent[] = [
  { id: 'stu-001', name: 'Kavindu Perera', grade: 9, medium: 'English', parentPhone: '+94 77 123 4567', feeStatus: 'paid', attendanceStatus: 'present', lastSeen: 'Last class: Present' },
  { id: 'stu-002', name: 'Tharindu Silva', grade: 9, medium: 'English', parentPhone: '+94 71 882 1099', feeStatus: 'overdue', attendanceStatus: 'absent', lastSeen: 'Last class: Absent' },
  { id: 'stu-003', name: 'Sithmi Fernando', grade: 8, medium: 'Sinhala', parentPhone: '+94 76 456 7788', feeStatus: 'partial', attendanceStatus: 'late', lastSeen: 'Last class: Present' },
  { id: 'stu-004', name: 'Mehuli Fernando', grade: 8, medium: 'English', parentPhone: '+94 70 900 1112', feeStatus: 'pending', attendanceStatus: 'unmarked', lastSeen: 'New enrollment' }
];
