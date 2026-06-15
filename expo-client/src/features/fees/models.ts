export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type PaymentMethod = 'cash' | 'bank' | 'online';

export type FeeInvoice = {
  id: string;
  studentName: string;
  grade: number;
  medium: string;
  className: string;
  month: string;
  monthlyFee: number;
  paidAmount: number;
  outstandingAmount: number;
  status: FeeStatus;
  parentPhone: string;
  dueDays: number;
};

export type PaymentRecord = {
  id: string;
  studentName: string;
  className: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receiptNo: string;
};
