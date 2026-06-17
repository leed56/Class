import { InvoiceType } from '@/lib/database.types';

export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type PaymentMethod = 'cash' | 'bank' | 'online';

export type FeeInvoice = {
  id: string;
  studentId: string;
  classId: string | null;
  invoiceType: InvoiceType;
  studentName: string;
  grade: number;
  medium: string;
  className: string;
  month: string;
  monthKey: string;
  monthlyFee: number;
  paidAmount: number;
  outstandingAmount: number;
  status: FeeStatus;
  parentPhone: string;
  dueDays: number;
};

export type PaymentAllocation = {
  label: string;
  amount: number;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string | null;
  studentName: string;
  className: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  receiptNo: string;
  parentPhone: string;
  note?: string | null;
  allocations: PaymentAllocation[];
};
