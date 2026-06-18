import {
  createTeacherWorkspace,
  getCurrentWorkspace,
  updateWorkspace,
} from '@/features/auth/authService';
import { DEMO_PARENT_PHONE } from '@/features/auth/demoAuth';
import { createClass } from '@/features/classes/classService';
import { listClasses } from '@/features/classes/classService';
import { enrollStudentInClass } from '@/features/enrollment/enrollmentService';
import { ensureDefaultLocationSetup, listHalls } from '@/features/locations/branchService';
import { createStudent, listStudents } from '@/features/students/studentService';

const DEMO_WORKSPACE_NAME = 'ClassFlow Demo Institute';

export async function ensureDemoWorkspace() {
  let workspace = await getCurrentWorkspace();

  if (!workspace) {
    workspace = await createTeacherWorkspace({
      name: DEMO_WORKSPACE_NAME,
      defaultLanguage: 'en',
    });
    await updateWorkspace({
      instituteType: 'institute',
      absenceAlertsEnabled: true,
    });
  }

  await seedDemoDataIfNeeded();
  return getCurrentWorkspace();
}

async function seedDemoDataIfNeeded() {
  const [classes, students] = await Promise.all([listClasses(), listStudents()]);
  if (classes.length > 0 && students.length > 0) return;

  await ensureDefaultLocationSetup();
  const halls = await listHalls();
  const hall = halls[0];
  const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const demoStudents = students.length > 0 ? students : await createDemoStudents();
  const demoClasses = classes.length > 0 ? classes : await createDemoClasses(todayWeekday, hall?.id ?? null);

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

async function createDemoClasses(weekday: string, hallId: string | null) {
  const classSeeds = [
    {
      subject: 'Combined Maths',
      grade: 11,
      medium: 'Sinhala' as const,
      hallId,
      weekday,
      startTime: '4:00 PM',
      endTime: '6:00 PM',
      monthlyFee: 4500,
    },
    {
      subject: 'Physics',
      grade: 11,
      medium: 'Sinhala' as const,
      hallId,
      weekday: weekday === 'Saturday' ? 'Sunday' : 'Saturday',
      startTime: '8:00 AM',
      endTime: '10:00 AM',
      monthlyFee: 3500,
    },
  ];

  return Promise.all(classSeeds.map((seed) => createClass(seed)));
}

export async function isDemoAccountEmail(email: string | undefined | null) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  const demoEmail =
    process.env.EXPO_PUBLIC_DEMO_TEACHER_EMAIL?.trim().toLowerCase() || 'demo@classflow.lk';
  return normalized === demoEmail;
}
