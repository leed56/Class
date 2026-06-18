import {
  createTeacherWorkspace,
  getCurrentWorkspace,
  updateWorkspace,
} from '@/features/auth/authService';
import {
  DEMO_ACADEMY_WORKSPACE_NAME,
  DEMO_IT_ACADEMY_EMAIL,
  DEMO_MARITIME_EMAIL,
  DEMO_PARENT_PHONE,
  DEMO_TEACHER_EMAIL,
} from '@/features/auth/demoAuth';
import { createOffering, listCatalogTree } from '@/features/catalog/catalogService';
import { createClass, listClasses } from '@/features/classes/classService';
import { AcademySector } from '@/features/courses/slCourseModel';
import { enrollStudentInClass } from '@/features/enrollment/enrollmentService';
import { ensureDefaultLocationSetup, listHalls } from '@/features/locations/branchService';
import { createStudent, listStudents } from '@/features/students/studentService';
import { InstituteType } from '@/lib/database.types';

const DEMO_INSTITUTE_WORKSPACE_NAME = 'Nugegoda Tuition Tower';

export async function ensureDemoWorkspace() {
  let workspace = await getCurrentWorkspace();

  if (!workspace) {
    workspace = await createTeacherWorkspace({
      name: DEMO_INSTITUTE_WORKSPACE_NAME,
      defaultLanguage: 'en',
    });
    await updateWorkspace({
      instituteType: 'institute',
      absenceAlertsEnabled: true,
    });
  }

  await seedInstituteDemoDataIfNeeded();
  return getCurrentWorkspace();
}

export async function seedAcademyDemoData(academySector: AcademySector = 'school_tuition') {
  await updateWorkspace({
    instituteType: 'academy',
    academySector,
    admissionFeeLkr: 2500,
    proRataEnabled: true,
    minAttendanceForCertificate: 75,
    requireFeesClearForCertificate: true,
    absenceAlertsEnabled: true,
  });

  const [classes, students] = await Promise.all([listClasses(), listStudents()]);
  if (classes.length > 0 && students.length > 0) return;

  const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const demoStudents = students.length > 0 ? students : await createDemoStudents();
  const demoClasses =
    classes.length > 0
      ? classes
      : academySector === 'maritime'
        ? await createMaritimeAcademyDemoClasses(todayWeekday)
        : academySector === 'it_technology'
          ? await createItAcademyDemoClasses(todayWeekday)
          : await createAcademyDemoClasses(todayWeekday);

  if (demoStudents.length > 0 && demoClasses.length > 0) {
    await Promise.all(
      demoStudents.map((student) => enrollStudentInClass(demoClasses[0].id, student.id)),
    );
  }
}

async function seedInstituteDemoDataIfNeeded() {
  const [classes, students] = await Promise.all([listClasses(), listStudents()]);
  if (classes.length > 0 && students.length > 0) return;

  await ensureDefaultLocationSetup();
  const halls = await listHalls();
  const hall = halls[0];
  const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const demoStudents = students.length > 0 ? students : await createDemoStudents();
  const demoClasses =
    classes.length > 0 ? classes : await createInstituteDemoClasses(todayWeekday, hall?.id ?? null);

  if (demoStudents.length > 0 && demoClasses.length > 0) {
    await Promise.all(
      demoStudents.map((student) => enrollStudentInClass(demoClasses[0].id, student.id)),
    );
  }
}

async function createDemoStudents() {
  const seeds = [
    {
      fullName: 'Nimali Perera',
      grade: 11,
      medium: 'Sinhala' as const,
      school: 'Ananda College',
      parentName: 'Sunil Perera',
      parentPhone: DEMO_PARENT_PHONE,
      consentCaptured: true,
    },
    {
      fullName: 'Kasun Jayawardena',
      grade: 11,
      medium: 'Sinhala' as const,
      school: 'Royal College',
      parentName: 'Mala Jayawardena',
      parentPhone: '0777654321',
      consentCaptured: true,
    },
  ];

  return Promise.all(seeds.map((seed) => createStudent(seed)));
}

async function createInstituteDemoClasses(weekday: string, hallId: string | null) {
  const classSeeds = [
    {
      subject: 'Combined Maths — Theory',
      grade: 13,
      medium: 'Sinhala' as const,
      hallId,
      weekday,
      startTime: '4:00 PM',
      endTime: '6:00 PM',
      monthlyFee: 4500,
      sector: 'school_tuition',
      sessionType: 'theory',
      qualificationLevel: 'school_session',
    },
    {
      subject: 'Physics — Theory',
      grade: 13,
      medium: 'Sinhala' as const,
      hallId,
      weekday: weekday === 'Saturday' ? 'Sunday' : 'Saturday',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      monthlyFee: 4000,
      sector: 'school_tuition',
      sessionType: 'theory',
      qualificationLevel: 'school_session',
    },
  ];

  return Promise.all(classSeeds.map((seed) => createClass(seed)));
}

async function createAcademyDemoClasses(weekday: string) {
  const theoryClass = await createClass({
    subject: 'Combined Maths — Theory',
    grade: 13,
    medium: 'Sinhala',
    hallId: null,
    weekday,
    startTime: '4:00 PM',
    endTime: '6:00 PM',
    monthlyFee: 4500,
    sector: 'school_tuition',
    sessionType: 'theory',
    qualificationLevel: 'school_session',
  });

  const tree = await listCatalogTree();
  const batchId = tree[0]?.batches[0]?.id;
  if (batchId) {
    await createOffering({
      batchId,
      offeringType: 'revision',
      name: 'Combined Maths — Revision',
      defaultMonthlyFee: 3000,
    });
  }

  const revisionClass = await createClass({
    subject: 'Combined Maths — Revision',
    grade: 13,
    medium: 'Sinhala',
    hallId: null,
    weekday: weekday === 'Saturday' ? 'Sunday' : 'Saturday',
    startTime: '8:00 AM',
    endTime: '10:30 AM',
    monthlyFee: 3000,
    sector: 'school_tuition',
    sessionType: 'revision',
    qualificationLevel: 'school_session',
  });

  return [theoryClass, revisionClass];
}

async function createMaritimeAcademyDemoClasses(weekday: string) {
  const stcwClass = await createClass({
    subject: 'STCW Basic Safety Training (full package)',
    grade: 12,
    medium: 'English',
    hallId: null,
    weekday,
    startTime: '8:00 AM',
    endTime: '4:00 PM',
    monthlyFee: 85000,
    sector: 'maritime',
    sessionType: 'practical',
    qualificationLevel: 'short_course',
    intakeLabel: '2026 Intake',
  });

  const ratingClass = await createClass({
    subject: 'Pre-Sea Training — Deck Rating',
    grade: 11,
    medium: 'English',
    hallId: null,
    weekday: weekday === 'Saturday' ? 'Sunday' : 'Saturday',
    startTime: '8:00 AM',
    endTime: '12:00 PM',
    monthlyFee: 95000,
    sector: 'maritime',
    sessionType: 'practical',
    qualificationLevel: 'certificate',
    intakeLabel: '2026 Intake',
  });

  return [stcwClass, ratingClass];
}

async function createItAcademyDemoClasses(weekday: string) {
  const diplomaClass = await createClass({
    subject: 'Diploma in Software Engineering — Year 1',
    grade: 13,
    medium: 'English',
    hallId: null,
    weekday,
    startTime: '5:00 PM',
    endTime: '8:00 PM',
    monthlyFee: 18000,
    sector: 'it_technology',
    sessionType: 'theory',
    qualificationLevel: 'diploma',
    intakeLabel: '2026 Intake',
  });

  const nvqClass = await createClass({
    subject: 'NVQ Level 4 — ICT Technician',
    grade: 12,
    medium: 'English',
    hallId: null,
    weekday: weekday === 'Saturday' ? 'Sunday' : 'Saturday',
    startTime: '9:00 AM',
    endTime: '12:00 PM',
    monthlyFee: 12000,
    sector: 'it_technology',
    sessionType: 'practical',
    qualificationLevel: 'nvq',
    intakeLabel: '2026 Intake',
  });

  return [diplomaClass, nvqClass];
}

export async function isDemoAccountEmail(email: string | undefined | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  const demoEmail = DEMO_TEACHER_EMAIL.trim().toLowerCase();
  return normalized === demoEmail;
}

export async function isDemoAcademyAccountEmail(email: string | undefined | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  const demoEmail =
    process.env.EXPO_PUBLIC_DEMO_ACADEMY_EMAIL?.trim().toLowerCase() || 'academy@classflow.lk';
  return normalized === demoEmail;
}

export async function isDemoMaritimeAccountEmail(email: string | undefined | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return normalized === DEMO_MARITIME_EMAIL.trim().toLowerCase();
}

export async function isDemoItAcademyAccountEmail(email: string | undefined | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return normalized === DEMO_IT_ACADEMY_EMAIL.trim().toLowerCase();
}

export function getAcademyPresetWorkspaceName() {
  return DEMO_ACADEMY_WORKSPACE_NAME;
}

export async function applyWorkspaceTypeSettings(type: InstituteType, academySector?: AcademySector) {
  const resolvedSector = type === 'institute' || type === 'solo' ? 'school_tuition' : academySector ?? 'school_tuition';

  if (type === 'solo') {
    await updateWorkspace({
      instituteType: 'solo',
      academySector: resolvedSector,
      admissionFeeLkr: 0,
      proRataEnabled: true,
      absenceAlertsEnabled: true,
    });
    return;
  }

  if (type === 'academy') {
    await updateWorkspace({
      instituteType: 'academy',
      academySector: resolvedSector,
      admissionFeeLkr: 2500,
      proRataEnabled: true,
      minAttendanceForCertificate: 75,
      requireFeesClearForCertificate: true,
      absenceAlertsEnabled: true,
    });
    return;
  }

  await updateWorkspace({
    instituteType: 'institute',
    academySector: resolvedSector,
    admissionFeeLkr: 2500,
    proRataEnabled: true,
    minAttendanceForCertificate: 75,
    requireFeesClearForCertificate: true,
    absenceAlertsEnabled: true,
  });
}
