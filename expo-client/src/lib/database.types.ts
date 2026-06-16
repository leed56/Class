export type WorkspacePlan = 'free' | 'starter' | 'institute';
export type LanguageCode = 'en' | 'si' | 'ta';
export type Medium = 'English' | 'Sinhala' | 'Tamil';
export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type PaymentMethod = 'cash' | 'bank' | 'online';
export type WorkspaceRole = 'owner' | 'teacher' | 'admin';

export type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  plan: WorkspacePlan;
  default_language: LanguageCode;
  created_at: string;
};

export type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

export type StudentRow = {
  id: string;
  workspace_id: string;
  full_name: string;
  grade: number;
  medium: Medium;
  school: string | null;
  parent_name: string | null;
  parent_phone: string;
  consent_captured: boolean;
  active: boolean;
  created_at: string;
};

export type ClassRow = {
  id: string;
  workspace_id: string;
  subject: string;
  grade: number;
  medium: Medium;
  hall: string | null;
  weekday: string;
  start_time: string;
  end_time: string;
  monthly_fee: number;
  active: boolean;
  created_at: string;
};

export type ClassEnrollmentRow = {
  id: string;
  workspace_id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
};

export type FeeInvoiceRow = {
  id: string;
  workspace_id: string;
  student_id: string;
  class_id: string;
  month: string;
  monthly_fee: number;
  paid_amount: number;
  status: FeeStatus;
  due_date: string | null;
  created_at: string;
};

export type AttendanceSessionRow = {
  id: string;
  workspace_id: string;
  class_id: string;
  session_date: string;
  status: 'draft' | 'saved' | 'synced';
  created_at: string;
};

export type AttendanceMarkRow = {
  id: string;
  workspace_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  note: string | null;
  marked_at: string;
};

export type PaymentRow = {
  id: string;
  workspace_id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  receipt_no: string;
  paid_at: string;
  note: string | null;
};
