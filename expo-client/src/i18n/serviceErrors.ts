import { interpolate } from '@/i18n/format';

export const SERVICE_ERROR_CODES = {
  workspaceNotFound: 'workspaceNotFound',
  supabaseNotConfigured: 'supabaseNotConfigured',
  endTimeAfterStart: 'endTimeAfterStart',
  monthlyRentRequired: 'monthlyRentRequired',
  bookingNotFoundOrArchived: 'bookingNotFoundOrArchived',
  paymentAmountRequired: 'paymentAmountRequired',
  rentInvoiceNotFound: 'rentInvoiceNotFound',
  invoiceAlreadySettled: 'invoiceAlreadySettled',
  paymentExceedsOutstandingRent: 'paymentExceedsOutstandingRent',
  certificatePdfWebOnly: 'certificatePdfWebOnly',
  workspaceRequiredStudents: 'workspaceRequiredStudents',
  workspaceRequiredEnrollments: 'workspaceRequiredEnrollments',
  parentConsentRequired: 'parentConsentRequired',
  studentNotFound: 'studentNotFound',
  studentNotFoundOrArchived: 'studentNotFoundOrArchived',
  studentNotFoundOrActive: 'studentNotFoundOrActive',
  studentAlreadyEnrolled: 'studentAlreadyEnrolled',
  studentNameRequired: 'studentNameRequired',
  parentPhoneRequired: 'parentPhoneRequired',
  workspaceRequiredFees: 'workspaceRequiredFees',
  workspaceRequiredReceipts: 'workspaceRequiredReceipts',
  workspaceRequiredPayments: 'workspaceRequiredPayments',
  chargeDescriptionRequired: 'chargeDescriptionRequired',
  chargeAmountGreaterThanZero: 'chargeAmountGreaterThanZero',
  classNotFound: 'classNotFound',
  invoiceNotFound: 'invoiceNotFound',
  paymentAmountGreaterThanZero: 'paymentAmountGreaterThanZero',
  selectInvoiceToPay: 'selectInvoiceToPay',
  invoicesNotFound: 'invoicesNotFound',
  splitPaymentSameStudent: 'splitPaymentSameStudent',
  splitPaymentLineAmountRequired: 'splitPaymentLineAmountRequired',
  workspaceRequiredAttendance: 'workspaceRequiredAttendance',
  workspaceRequiredAttendanceSync: 'workspaceRequiredAttendanceSync',
  workspaceRequiredAttendanceHistory: 'workspaceRequiredAttendanceHistory',
  offlineAttendanceContextRequired: 'offlineAttendanceContextRequired',
  workspaceRequiredClasses: 'workspaceRequiredClasses',
  workspaceRequiredClassesArchive: 'workspaceRequiredClassesArchive',
  workspaceRequiredClassesArchivedView: 'workspaceRequiredClassesArchivedView',
  workspaceRequiredClassesRestore: 'workspaceRequiredClassesRestore',
  classNotFoundOrArchived: 'classNotFoundOrArchived',
  classNotFoundOrActive: 'classNotFoundOrActive',
  hallNotFound: 'hallNotFound',
  invalidTimeFormat: 'invalidTimeFormat',
  subjectRequired: 'subjectRequired',
  classDayRequired: 'classDayRequired',
  startTimeRequired: 'startTimeRequired',
  endTimeRequired: 'endTimeRequired',
  signInRequiredCreateWorkspace: 'signInRequiredCreateWorkspace',
  signInRequiredUpdateWorkspace: 'signInRequiredUpdateWorkspace',
  signInRequiredUpdateProfile: 'signInRequiredUpdateProfile',
  instituteNameRequired: 'instituteNameRequired',
  certificateCompletionBodyRequired: 'certificateCompletionBodyRequired',
  certificateAchievementBodyRequired: 'certificateAchievementBodyRequired',
  absenceAlertTemplateRequired: 'absenceAlertTemplateRequired',
  displayNameRequired: 'displayNameRequired',
  branchNameRequired: 'branchNameRequired',
  branchNotFound: 'branchNotFound',
  branchNotFoundOrArchived: 'branchNotFoundOrArchived',
  hallNameRequired: 'hallNameRequired',
  hallRecordNotFound: 'hallRecordNotFound',
  hallRecordNotFoundOrArchived: 'hallRecordNotFoundOrArchived',
  paymentExceedsOutstandingBalance: 'paymentExceedsOutstandingBalance',
  splitPaymentExceedsInvoiceBalance: 'splitPaymentExceedsInvoiceBalance',
  workspaceRequiredCertificates: 'workspaceRequiredCertificates',
  certificationAcademyInstituteOnly: 'certificationAcademyInstituteOnly',
  certificateTitleRequired: 'certificateTitleRequired',
  selectStudentForCertificate: 'selectStudentForCertificate',
  studentNotEligibleForCertificate: 'studentNotEligibleForCertificate',
  noEligibleStudentsForCertificate: 'noEligibleStudentsForCertificate',
  certificateNotFoundOrRevoked: 'certificateNotFoundOrRevoked',
  certificateAttendanceBelowRequired: 'certificateAttendanceBelowRequired',
  certificateOutstandingFees: 'certificateOutstandingFees',
  workspaceRequiredPrograms: 'workspaceRequiredPrograms',
  workspaceRequiredCatalogView: 'workspaceRequiredCatalogView',
  workspaceRequiredBatches: 'workspaceRequiredBatches',
  workspaceRequiredOfferings: 'workspaceRequiredOfferings',
  programNameRequired: 'programNameRequired',
  batchNameRequired: 'batchNameRequired',
  offeringNameRequired: 'offeringNameRequired',
  workspaceRequiredMessages: 'workspaceRequiredMessages',
  workspaceRequiredMessagesUpdate: 'workspaceRequiredMessagesUpdate',
  workspaceRequiredMessagesView: 'workspaceRequiredMessagesView',
  parentSessionExpired: 'parentSessionExpired',
  noOutstandingInvoicesToExport: 'noOutstandingInvoicesToExport',
  csvExportWebOnly: 'csvExportWebOnly',
  attendanceUpdateFailed: 'attendanceUpdateFailed',
  markAllPresentFailed: 'markAllPresentFailed',
} as const;

export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[keyof typeof SERVICE_ERROR_CODES];

const EN_MESSAGES: Record<ServiceErrorCode, string> = {
  workspaceNotFound: 'Workspace not found.',
  supabaseNotConfigured: 'Supabase is not configured.',
  endTimeAfterStart: 'End time must be after start time.',
  monthlyRentRequired: 'Monthly hall rent is required.',
  bookingNotFoundOrArchived: 'Booking not found or already archived.',
  paymentAmountRequired: 'Payment amount is required.',
  rentInvoiceNotFound: 'Rent invoice not found.',
  invoiceAlreadySettled: 'This invoice is already settled.',
  paymentExceedsOutstandingRent: 'Payment exceeds outstanding rent.',
  certificatePdfWebOnly:
    'PDF download is available on web. Open ClassFlow in your browser to export certificates.',
  workspaceRequiredStudents: 'Create your workspace before managing students.',
  workspaceRequiredEnrollments: 'Create your workspace before managing enrollments.',
  parentConsentRequired: 'Parent consent is required before saving a student record.',
  studentNotFound: 'Student not found.',
  studentNotFoundOrArchived: 'Student not found or already archived.',
  studentNotFoundOrActive: 'Student not found or already active.',
  studentAlreadyEnrolled: 'This student is already enrolled in this class.',
  studentNameRequired: 'Student name is required.',
  parentPhoneRequired: 'Parent phone is required.',
  workspaceRequiredFees: 'Create your workspace before managing fees.',
  workspaceRequiredReceipts: 'Create your workspace before viewing receipts.',
  workspaceRequiredPayments: 'Create your workspace before recording payments.',
  chargeDescriptionRequired: 'Add a description for this charge.',
  chargeAmountGreaterThanZero: 'Enter an amount greater than zero.',
  classNotFound: 'Class not found.',
  invoiceNotFound: 'Invoice not found.',
  paymentAmountGreaterThanZero: 'Enter a payment amount greater than zero.',
  selectInvoiceToPay: 'Select at least one invoice to pay.',
  invoicesNotFound: 'One or more invoices could not be found.',
  splitPaymentSameStudent: 'All selected invoices must belong to the same student.',
  splitPaymentLineAmountRequired: 'Each payment line must be greater than zero.',
  workspaceRequiredAttendance: 'Create your workspace before managing attendance.',
  workspaceRequiredAttendanceSync: 'Create your workspace before syncing attendance.',
  workspaceRequiredAttendanceHistory: 'Create your workspace before viewing attendance history.',
  offlineAttendanceContextRequired: 'Offline attendance requires class context.',
  workspaceRequiredClasses: 'Create your workspace before managing classes.',
  workspaceRequiredClassesArchive: 'Create your workspace before archiving classes.',
  workspaceRequiredClassesArchivedView: 'Create your workspace before viewing archived classes.',
  workspaceRequiredClassesRestore: 'Create your workspace before restoring classes.',
  classNotFoundOrArchived: 'Class not found or already archived.',
  classNotFoundOrActive: 'Class not found or already active.',
  hallNotFound: 'Selected hall not found.',
  invalidTimeFormat: 'Use time format like 10:30 AM or 15:30.',
  subjectRequired: 'Subject is required.',
  classDayRequired: 'Class day is required.',
  startTimeRequired: 'Start time is required.',
  endTimeRequired: 'End time is required.',
  signInRequiredCreateWorkspace: 'Please sign in before creating a workspace.',
  signInRequiredUpdateWorkspace: 'Please sign in before updating workspace settings.',
  signInRequiredUpdateProfile: 'Please sign in before updating your profile.',
  instituteNameRequired: 'Institute name is required.',
  certificateCompletionBodyRequired: 'Completion certificate wording is required.',
  certificateAchievementBodyRequired: 'Achievement certificate wording is required.',
  absenceAlertTemplateRequired: 'Absence alert template is required.',
  displayNameRequired: 'Display name is required.',
  branchNameRequired: 'Branch name is required.',
  branchNotFound: 'Branch not found.',
  branchNotFoundOrArchived: 'Branch not found or already archived.',
  hallNameRequired: 'Hall name is required.',
  hallRecordNotFound: 'Hall not found.',
  hallRecordNotFoundOrArchived: 'Hall not found or already archived.',
  paymentExceedsOutstandingBalance:
    'Amount cannot exceed the outstanding balance of LKR {{amount}}.',
  splitPaymentExceedsInvoiceBalance: 'Amount exceeds outstanding balance for {{className}}.',
  workspaceRequiredCertificates: 'Create your workspace before managing certificates.',
  certificationAcademyInstituteOnly:
    'Certification is available for academy and institute workspaces.',
  certificateTitleRequired: 'Certificate title is required.',
  selectStudentForCertificate: 'Select at least one student.',
  studentNotEligibleForCertificate: 'Student is not eligible for certification.',
  noEligibleStudentsForCertificate: 'No eligible students selected for certification.',
  certificateNotFoundOrRevoked: 'Certificate not found or already revoked.',
  certificateAttendanceBelowRequired:
    'Attendance {{actual}}% is below required {{required}}%.',
  certificateOutstandingFees: 'Outstanding fees: LKR {{amount}}.',
  workspaceRequiredPrograms: 'Create your workspace before adding programs.',
  workspaceRequiredCatalogView: 'Create your workspace before viewing the catalog.',
  workspaceRequiredBatches: 'Create your workspace before adding batches.',
  workspaceRequiredOfferings: 'Create your workspace before adding offerings.',
  programNameRequired: 'Program name is required.',
  batchNameRequired: 'Batch name is required.',
  offeringNameRequired: 'Offering name is required.',
  workspaceRequiredMessages: 'Create your workspace before logging messages.',
  workspaceRequiredMessagesUpdate: 'Create your workspace before updating messages.',
  workspaceRequiredMessagesView: 'Create your workspace before viewing message history.',
  parentSessionExpired: 'Parent session expired. Please sign in again.',
  noOutstandingInvoicesToExport: 'No outstanding invoices to export.',
  csvExportWebOnly: 'CSV export is only available in the browser.',
  attendanceUpdateFailed: 'Could not update attendance.',
  markAllPresentFailed: 'Could not mark all present.',
};

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly params?: Record<string, string | number>;

  constructor(code: ServiceErrorCode, params?: Record<string, string | number>) {
    const template = EN_MESSAGES[code];
    super(params ? interpolate(template, params) : template);
    this.code = code;
    this.params = params;
    this.name = 'ServiceError';
  }
}

export function throwServiceError(
  code: ServiceErrorCode,
  params?: Record<string, string | number>,
): never {
  throw new ServiceError(code, params);
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

type Translate = (path: string) => string;

export function resolveServiceErrorMessage(error: unknown, t: Translate, fallbackKey: string) {
  if (isServiceError(error)) {
    const path = `serviceErrors.${error.code}`;
    let localized = t(path);
    if (localized === path) localized = error.message;
    if (error.params) localized = interpolate(localized, error.params);
    return localized;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return t(fallbackKey);
}
