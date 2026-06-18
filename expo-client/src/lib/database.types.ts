export type WorkspacePlan = 'free' | 'starter' | 'institute';
export type LanguageCode = 'en' | 'si' | 'ta';
export type InstituteType = 'solo' | 'academy' | 'institute';
export type InvoiceType = 'monthly' | 'admission' | 'material' | 'exam';
export type CertificateType = 'completion' | 'achievement';
export type CertificatePrintAction = 'download' | 'share' | 'reprint';
export type Medium = 'English' | 'Sinhala' | 'Tamil';
export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type AttendanceStatus = 'present' | 'late' | 'absent';
export type PaymentMethod = 'cash' | 'bank' | 'online';
export type WorkspaceRole = 'owner' | 'teacher' | 'admin' | 'front_desk';

export type MessageDeliveryStatus = 'draft' | 'sent' | 'failed' | 'skipped';
export type MessageDeliveryType =
  | 'absence_alert'
  | 'fee_reminder'
  | 'certificate'
  | 'receipt'
  | 'announcement'
  | 'custom';
export type MessageDeliveryChannel = 'whatsapp' | 'sms';

export type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  plan: WorkspacePlan;
  default_language: LanguageCode;
  institute_type: InstituteType;
  academy_sector: string | null;
  admission_fee_lkr: number;
  pro_rata_enabled: boolean;
  min_attendance_for_certificate: number;
  require_fees_clear_for_certificate: boolean;
  certificate_signatory_name: string;
  certificate_signatory_title: string;
  certificate_completion_body: string;
  certificate_achievement_body: string;
  certificate_footer_note: string;
  absence_alerts_enabled: boolean;
  absence_alert_template: string;
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
  hall_id: string | null;
  weekday: string;
  start_time: string;
  end_time: string;
  monthly_fee: number;
  active: boolean;
  offering_id: string | null;
  sector: string | null;
  session_type: string | null;
  qualification_level: string | null;
  intake_label: string | null;
  created_at: string;
};

export type BranchRow = {
  id: string;
  workspace_id: string;
  name: string;
  address: string | null;
  active: boolean;
  created_at: string;
};

export type HallRow = {
  id: string;
  workspace_id: string;
  branch_id: string;
  name: string;
  capacity: number | null;
  active: boolean;
  created_at: string;
};

export type HallRentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export type HallBookingRow = {
  id: string;
  workspace_id: string;
  hall_id: string;
  teacher_user_id: string;
  label: string | null;
  weekday: string;
  start_time: string;
  end_time: string;
  monthly_rent_lkr: number;
  active: boolean;
  created_at: string;
};

export type HallRentInvoiceRow = {
  id: string;
  workspace_id: string;
  booking_id: string;
  teacher_user_id: string;
  month: string;
  amount: number;
  paid_amount: number;
  due_date: string | null;
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
  class_id: string | null;
  month: string | null;
  invoice_type: InvoiceType;
  description: string | null;
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
  invoice_id: string | null;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  receipt_no: string;
  paid_at: string;
  note: string | null;
};

export type PaymentAllocationRow = {
  id: string;
  workspace_id: string;
  payment_id: string;
  invoice_id: string;
  amount: number;
  created_at: string;
};

export type CertificateRow = {
  id: string;
  workspace_id: string;
  student_id: string;
  certificate_type: CertificateType;
  title: string;
  serial_no: string;
  issued_on: string;
  note: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
};

export type CertificatePrintRow = {
  id: string;
  workspace_id: string;
  certificate_id: string;
  printed_by: string | null;
  action: CertificatePrintAction;
  created_at: string;
};

export type MessageDeliveryRow = {
  id: string;
  workspace_id: string;
  student_id: string | null;
  session_id: string | null;
  parent_phone: string;
  message_type: MessageDeliveryType;
  channel: MessageDeliveryChannel;
  body: string;
  status: MessageDeliveryStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};
