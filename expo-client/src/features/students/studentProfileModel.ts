import { InstituteType, Medium } from '@/lib/database.types';

import { SCHOOL_GRADE_OPTIONS } from '@/features/courses/schoolSubjectModel';

/** Stored when academy students have no school grade (DB still requires grade 1–13). */
export const ACADEMY_STUDENT_GRADE_PLACEHOLDER = 13;

export function usesSchoolStudentFields(
  workspaceType: InstituteType | null | undefined,
  academySector?: string | null,
) {
  if (workspaceType === 'solo' || workspaceType === 'institute') return true;
  if (workspaceType === 'academy' && academySector === 'school_tuition') return true;
  return false;
}

export function formatStudentMeta(
  grade: number,
  medium: Medium,
  school: string,
  workspaceType?: InstituteType | null,
  academySector?: string | null,
) {
  if (!usesSchoolStudentFields(workspaceType, academySector)) {
    const entry = school && school !== 'School not set' ? school : null;
    return entry ? `${medium} • ${entry}` : medium;
  }
  const schoolLabel = school && school !== 'School not set' ? school : 'School not set';
  return `Grade ${grade} • ${medium} • ${schoolLabel}`;
}

export const SCHOOL_STUDENT_GRADE_OPTIONS = [...SCHOOL_GRADE_OPTIONS];
