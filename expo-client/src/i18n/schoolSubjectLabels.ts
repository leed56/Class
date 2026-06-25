import { COMMON_SCHOOL_SUBJECTS } from '@/features/courses/schoolSubjectModel';

type Translate = (path: string) => string;

const SUBJECT_KEY_BY_VALUE: Record<(typeof COMMON_SCHOOL_SUBJECTS)[number], string> = {
  Mathematics: 'mathematics',
  Science: 'science',
  Sinhala: 'sinhala',
  English: 'english',
  Tamil: 'tamil',
  History: 'history',
  Geography: 'geography',
  ICT: 'ict',
  Commerce: 'commerce',
  Accounting: 'accounting',
  Economics: 'economics',
  'Business Studies': 'businessStudies',
  Biology: 'biology',
  Physics: 'physics',
  Chemistry: 'chemistry',
  'Combined Maths': 'combinedMaths',
  Buddhism: 'buddhism',
  'Civic Education': 'civicEducation',
  Art: 'art',
  Music: 'music',
  Dancing: 'dancing',
  'Health & Physical Education': 'healthPhysicalEducation',
  Literature: 'literature',
};

export function getLocalizedSchoolSubjectLabel(subject: string, t: Translate) {
  const key = SUBJECT_KEY_BY_VALUE[subject as (typeof COMMON_SCHOOL_SUBJECTS)[number]];
  return key ? t(`schoolSubjects.${key}`) : subject;
}

export function listLocalizedSchoolSubjects(t: Translate) {
  return COMMON_SCHOOL_SUBJECTS.map((value) => ({
    value,
    label: getLocalizedSchoolSubjectLabel(value, t),
  }));
}
