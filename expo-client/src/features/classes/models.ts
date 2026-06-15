export type Medium = 'English' | 'Sinhala' | 'Tamil';
export type ScheduleState = 'upcoming' | 'inProgress' | 'completed';

export type TuitionClass = {
  id: string;
  subject: string;
  grade: number;
  medium: Medium;
  hall: string;
  day: string;
  startTime: string;
  endTime: string;
  monthlyFee: number;
  capacity: number;
  enrolledCount: number;
  attendanceAverage: number;
  collectionPercent: number;
  state: ScheduleState;
};
