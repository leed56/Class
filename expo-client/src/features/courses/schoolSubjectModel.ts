import { InstituteType, Medium } from '@/lib/database.types';

export type SchoolSessionType = 'theory' | 'revision' | 'paper' | 'mass';

export const SCHOOL_GRADE_OPTIONS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13',
] as const;

export type SchoolGrade = (typeof SCHOOL_GRADE_OPTIONS)[number];

export const SCHOOL_SESSION_OPTIONS: { value: SchoolSessionType; label: string }[] = [
  { value: 'theory', label: 'Theory' },
  { value: 'revision', label: 'Revision' },
  { value: 'paper', label: 'Paper class' },
  { value: 'mass', label: 'Mass lecture' },
];

export const COMMON_SCHOOL_SUBJECTS = [
  'Mathematics',
  'Science',
  'Sinhala',
  'English',
  'Tamil',
  'History',
  'Geography',
  'ICT',
  'Commerce',
  'Accounting',
  'Economics',
  'Business Studies',
  'Biology',
  'Physics',
  'Chemistry',
  'Combined Maths',
  'Buddhism',
  'Civic Education',
  'Art',
  'Music',
  'Dancing',
  'Health & Physical Education',
  'Literature',
];

const sessionLabels: Record<SchoolSessionType, string> = {
  theory: 'Theory',
  revision: 'Revision',
  paper: 'Paper class',
  mass: 'Mass lecture',
};

export function getSchoolSessionLabel(type: SchoolSessionType) {
  return sessionLabels[type];
}

export function buildSchoolClassSubject(subjectName: string, sessionType: SchoolSessionType) {
  const trimmed = subjectName.trim();
  if (!trimmed) return '';
  return `${trimmed} — ${getSchoolSessionLabel(sessionType)}`;
}

export function parseSchoolClassSubject(stored: string): { subjectName: string; sessionType: SchoolSessionType } {
  if (!stored.includes(' — ')) {
    return { subjectName: stored, sessionType: 'theory' };
  }
  const [subjectName, sessionPart] = stored.split(' — ');
  const match = SCHOOL_SESSION_OPTIONS.find(
    (item) => item.label.toLowerCase() === sessionPart.trim().toLowerCase(),
  );
  return {
    subjectName: subjectName.trim(),
    sessionType: match?.value ?? 'theory',
  };
}

export function formatSchoolClassMeta(grade: number, medium: Medium, subject: string) {
  const parsed = parseSchoolClassSubject(subject);
  const gradeLabel =
    grade >= 12 ? `Grade ${grade} (A/L prep)` : grade >= 10 ? `Grade ${grade} (O/L prep)` : `Grade ${grade}`;
  return `${gradeLabel} • ${medium} • ${parsed.subjectName}`;
}

export function gradeToNumber(grade: SchoolGrade) {
  return Number(grade);
}

export function usesSchoolClassForm(
  workspaceType: InstituteType | null | undefined,
  sector?: string,
) {
  if (workspaceType === 'solo' || workspaceType === 'institute') return true;
  if (workspaceType === 'academy' && sector === 'school_tuition') return true;
  return false;
}

export function isSchoolClassSubject(subject: string) {
  if (!subject.includes(' — ')) return false;
  const { sessionType } = parseSchoolClassSubject(subject);
  return sessionType !== 'theory' || subject.endsWith(' — Theory');
}
