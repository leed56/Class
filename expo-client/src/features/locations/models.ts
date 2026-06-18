export type Branch = {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  createdAt: string;
};

export type Hall = {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  capacity: number | null;
  active: boolean;
  createdAt: string;
};

export type HallOption = {
  id: string;
  label: string;
  branchId: string;
  branchName: string;
  hallName: string;
};

export type ScheduleConflict = {
  classId: string;
  subject: string;
  grade: number;
  weekday: string;
  startTime: string;
  endTime: string;
  hallLabel: string;
};

export type BranchReportRow = {
  branchId: string;
  branchName: string;
  classCount: number;
  collected: number;
  outstanding: number;
  collectionPercent: number;
  attendancePercent: number;
};
