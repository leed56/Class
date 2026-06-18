export type Medium = 'English' | 'Sinhala' | 'Tamil';
export type ScheduleState = 'upcoming' | 'inProgress' | 'completed';

export type TuitionClass = {
  id: string;
  subject: string;
  grade: number;
  medium: Medium;
  hall: string;
  hallId: string | null;
  branchName: string | null;
  day: string;
  startTime: string;
  endTime: string;
  monthlyFee: number;
  capacity: number;
  enrolledCount: number;
  attendanceAverage: number;
  collectionPercent: number;
  state: ScheduleState;
  sector: string | null;
  sessionType: string | null;
  qualificationLevel: string | null;
  intakeLabel: string | null;
};
