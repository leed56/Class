export type HallRentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type HallBooking = {
  id: string;
  hallId: string;
  hallLabel: string;
  teacherUserId: string;
  teacherName: string;
  label: string | null;
  weekday: string;
  startTime: string;
  endTime: string;
  monthlyRentLkr: number;
  active: boolean;
};

export type HallRentInvoice = {
  id: string;
  bookingId: string;
  teacherUserId: string;
  teacherName: string;
  hallLabel: string;
  bookingLabel: string | null;
  weekday: string;
  slotLabel: string;
  month: string;
  monthLabel: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: HallRentStatus;
  dueDate: string | null;
};

export type HallRentSummary = {
  monthKey: string;
  monthLabel: string;
  totalDue: number;
  collected: number;
  outstanding: number;
  defaulterCount: number;
  activeBookings: number;
};

export type HallBookingInput = {
  hallId: string;
  teacherUserId: string;
  label?: string;
  weekday: string;
  startTime: string;
  endTime: string;
  monthlyRentLkr: number;
};
