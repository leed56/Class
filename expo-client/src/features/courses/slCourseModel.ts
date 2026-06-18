import { MARITIME_COURSE_TEMPLATES } from '@/features/courses/maritimeCourseModel';
import {
  formatSchoolClassMeta,
  isSchoolClassSubject,
} from '@/features/courses/schoolSubjectModel';
import { InstituteType, Medium } from '@/lib/database.types';

/** Industry vertical — Sri Lankan academy/institute sector */
export type AcademySector =
  | 'school_tuition'
  | 'it_technology'
  | 'maritime'
  | 'gemology_jewellery'
  | 'psychology_counselling'
  | 'business_management'
  | 'language'
  | 'hospitality_tourism'
  | 'health_sciences'
  | 'aviation'
  | 'creative_media'
  | 'vocational_nvq'
  | 'corporate_training';

/** How the course is structured in that sector */
export type QualificationLevel =
  | 'school_session'
  | 'certificate'
  | 'foundation'
  | 'diploma'
  | 'higher_diploma'
  | 'professional'
  | 'nvq'
  | 'module'
  | 'short_course'
  | 'workshop';

export type CourseSessionType = 'theory' | 'revision' | 'paper' | 'practical' | 'lab' | 'simulator' | 'clinical' | 'online';

/** @deprecated Use sector + qualificationLevel — kept for school tuition templates */
export type ExamLevel = 'O/L' | 'A/L' | 'Grade 5 Scholarship' | 'London A/L' | 'Other';

export type SlCourseTemplate = {
  id: string;
  label: string;
  sector: AcademySector;
  qualificationLevel: QualificationLevel;
  subject: string;
  sessionType: CourseSessionType;
  medium: Medium;
  gradeCompat: number;
  suggestedFee: number;
  /** School tuition only */
  examLevel?: ExamLevel;
  /** Professional courses — intake batch label */
  intakeLabel?: string;
};

export type AcademySectorInfo = {
  id: AcademySector;
  label: string;
  subtitle: string;
  icon: string;
  examples: string;
};

export const ACADEMY_SECTORS: AcademySectorInfo[] = [
  {
    id: 'school_tuition',
    label: 'School tuition',
    subtitle: 'O/L, A/L, scholarship — theory, revision, paper',
    icon: 'school-outline',
    examples: 'Combined Maths, Physics, Sinhala medium classes',
  },
  {
    id: 'it_technology',
    label: 'IT & technology',
    subtitle: 'Software, networking, AI, diplomas & certs',
    icon: 'laptop',
    examples: 'iCET, SJIIT — Diploma in Software Engineering',
  },
  {
    id: 'maritime',
    label: 'Maritime & marine',
    subtitle: 'Officer training, STCW, ratings, simulators',
    icon: 'ferry',
    examples: 'MSTI, CINEC — Deck cadet, Basic Safety',
  },
  {
    id: 'gemology_jewellery',
    label: 'Gemology & jewellery',
    subtitle: 'Gem identification, cutting, CAD, NVQ trades',
    icon: 'diamond-stone',
    examples: 'GJRTI, GASL — Diploma in Gemmology',
  },
  {
    id: 'psychology_counselling',
    label: 'Psychology & counselling',
    subtitle: 'Diplomas, clinical hours, NVQ psychotherapy',
    icon: 'head-heart-outline',
    examples: 'RIPC, CIRP — Diploma in Counselling',
  },
  {
    id: 'business_management',
    label: 'Business & management',
    subtitle: 'HND, HR, marketing, entrepreneurship',
    icon: 'briefcase-outline',
    examples: 'IDM business faculty, NIBM programmes',
  },
  {
    id: 'language',
    label: 'Language',
    subtitle: 'English, Japanese, Korean, IELTS prep',
    icon: 'translate',
    examples: 'IELTS, JLPT, spoken English batches',
  },
  {
    id: 'hospitality_tourism',
    label: 'Hospitality & tourism',
    subtitle: 'Chef, hotel ops, travel & tourism diplomas',
    icon: 'silverware-fork-knife',
    examples: 'Food production cert, hotel management HND',
  },
  {
    id: 'health_sciences',
    label: 'Health sciences',
    subtitle: 'Nursing aide, pharmacy assistant, first aid',
    icon: 'hospital-box-outline',
    examples: 'Nursing NVQ, caregiver programmes',
  },
  {
    id: 'aviation',
    label: 'Aviation',
    subtitle: 'Cabin crew, aircraft maintenance, ground ops',
    icon: 'airplane',
    examples: 'Cabin crew initial, AME modules',
  },
  {
    id: 'creative_media',
    label: 'Creative & media',
    subtitle: 'Fashion, photography, multimedia, design',
    icon: 'palette-outline',
    examples: 'Fashion design diploma, video production',
  },
  {
    id: 'vocational_nvq',
    label: 'Vocational / NVQ',
    subtitle: 'TVEC trades — electrical, plumbing, welding',
    icon: 'hammer-wrench',
    examples: 'NVQ Level 4 Electrician, DTET programmes',
  },
  {
    id: 'corporate_training',
    label: 'Corporate & short courses',
    subtitle: 'Workshops, seminars, in-house training days',
    icon: 'presentation',
    examples: 'Leadership workshop, 2-day STCW refresher',
  },
];

const sessionLabels: Record<CourseSessionType, string> = {
  theory: 'Theory',
  revision: 'Revision',
  paper: 'Paper class',
  practical: 'Practical',
  lab: 'Lab',
  simulator: 'Simulator',
  clinical: 'Clinical',
  online: 'Online',
};

const qualificationLabels: Record<QualificationLevel, string> = {
  school_session: 'Class session',
  certificate: 'Certificate',
  foundation: 'Foundation',
  diploma: 'Diploma',
  higher_diploma: 'Higher Diploma',
  professional: 'Professional',
  nvq: 'NVQ',
  module: 'Module',
  short_course: 'Short course',
  workshop: 'Workshop',
};

export const SL_COURSE_TEMPLATES: SlCourseTemplate[] = [
  // —— School tuition ——
  {
    id: 'al-combined-maths-theory-si',
    label: 'A/L Combined Maths — Theory',
    sector: 'school_tuition',
    qualificationLevel: 'school_session',
    examLevel: 'A/L',
    subject: 'A/L Combined Maths — Theory',
    sessionType: 'theory',
    medium: 'Sinhala',
    gradeCompat: 13,
    suggestedFee: 4500,
  },
  {
    id: 'al-combined-maths-revision-si',
    label: 'A/L Combined Maths — Revision',
    sector: 'school_tuition',
    qualificationLevel: 'school_session',
    examLevel: 'A/L',
    subject: 'A/L Combined Maths — Revision',
    sessionType: 'revision',
    medium: 'Sinhala',
    gradeCompat: 13,
    suggestedFee: 3000,
  },
  {
    id: 'al-physics-theory-si',
    label: 'A/L Physics — Theory',
    sector: 'school_tuition',
    qualificationLevel: 'school_session',
    examLevel: 'A/L',
    subject: 'A/L Physics — Theory',
    sessionType: 'theory',
    medium: 'Sinhala',
    gradeCompat: 13,
    suggestedFee: 4000,
  },
  {
    id: 'ol-science-theory-si',
    label: 'O/L Science — Theory',
    sector: 'school_tuition',
    qualificationLevel: 'school_session',
    examLevel: 'O/L',
    subject: 'O/L Science — Theory',
    sessionType: 'theory',
    medium: 'Sinhala',
    gradeCompat: 11,
    suggestedFee: 2800,
  },
  // —— IT & technology ——
  {
    id: 'it-dip-software-eng',
    label: 'Diploma in Software Engineering',
    sector: 'it_technology',
    qualificationLevel: 'diploma',
    subject: 'Diploma in Software Engineering',
    sessionType: 'lab',
    medium: 'English',
    gradeCompat: 12,
    suggestedFee: 45000,
    intakeLabel: '2026 Intake',
  },
  {
    id: 'it-hdip-computer-eng',
    label: 'Higher Diploma in Computer Engineering',
    sector: 'it_technology',
    qualificationLevel: 'higher_diploma',
    subject: 'Higher Diploma in Computer Engineering',
    sessionType: 'lab',
    medium: 'English',
    gradeCompat: 13,
    suggestedFee: 65000,
    intakeLabel: '2026 Intake',
  },
  {
    id: 'it-cert-web-dev',
    label: 'Certificate in Full-Stack Web Development',
    sector: 'it_technology',
    qualificationLevel: 'certificate',
    subject: 'Certificate in Full-Stack Web Development',
    sessionType: 'lab',
    medium: 'English',
    gradeCompat: 11,
    suggestedFee: 35000,
  },
  // —— Gemology ——
  {
    id: 'gem-dip-professional',
    label: 'Diploma in Professional Gemmology',
    sector: 'gemology_jewellery',
    qualificationLevel: 'diploma',
    subject: 'Diploma in Professional Gemmology',
    sessionType: 'lab',
    medium: 'English',
    gradeCompat: 13,
    suggestedFee: 180000,
    intakeLabel: '2026 Intake',
  },
  {
    id: 'gem-nvq-cutting',
    label: 'NVQ Level 4 — Gem Cutting & Polishing',
    sector: 'gemology_jewellery',
    qualificationLevel: 'nvq',
    subject: 'NVQ Level 4 — Gem Cutting & Polishing',
    sessionType: 'practical',
    medium: 'Sinhala',
    gradeCompat: 11,
    suggestedFee: 45000,
  },
  {
    id: 'gem-cert-basic',
    label: 'Certificate in Basic Gemmology',
    sector: 'gemology_jewellery',
    qualificationLevel: 'certificate',
    subject: 'Certificate in Basic Gemmology',
    sessionType: 'lab',
    medium: 'English',
    gradeCompat: 12,
    suggestedFee: 55000,
  },
  // —— Psychology & counselling ——
  {
    id: 'psy-dip-counselling',
    label: 'Diploma in Counselling (NVQ 5)',
    sector: 'psychology_counselling',
    qualificationLevel: 'diploma',
    subject: 'Diploma in Counselling (NVQ 5)',
    sessionType: 'clinical',
    medium: 'English',
    gradeCompat: 13,
    suggestedFee: 95000,
    intakeLabel: '2026 Intake',
  },
  {
    id: 'psy-module-part1',
    label: 'Counselling Programme — Part 1',
    sector: 'psychology_counselling',
    qualificationLevel: 'module',
    subject: 'Counselling Programme — Part 1',
    sessionType: 'theory',
    medium: 'English',
    gradeCompat: 13,
    suggestedFee: 48000,
  },
  {
    id: 'psy-cert-skills',
    label: 'Certificate in Counselling Skills',
    sector: 'psychology_counselling',
    qualificationLevel: 'certificate',
    subject: 'Certificate in Counselling Skills',
    sessionType: 'clinical',
    medium: 'English',
    gradeCompat: 12,
    suggestedFee: 35000,
  },
  // —— Business ——
  {
    id: 'biz-hnd-management',
    label: 'HND in Business Management',
    sector: 'business_management',
    qualificationLevel: 'higher_diploma',
    subject: 'HND in Business Management',
    sessionType: 'theory',
    medium: 'English',
    gradeCompat: 13,
    suggestedFee: 75000,
    intakeLabel: '2026 Intake',
  },
  // —— Language ——
  {
    id: 'lang-ielts-prep',
    label: 'IELTS Preparation — Batch',
    sector: 'language',
    qualificationLevel: 'certificate',
    subject: 'IELTS Preparation — Batch',
    sessionType: 'theory',
    medium: 'English',
    gradeCompat: 12,
    suggestedFee: 25000,
  },
  // —— Hospitality ——
  {
    id: 'hotel-cert-food',
    label: 'Certificate in Food Production',
    sector: 'hospitality_tourism',
    qualificationLevel: 'certificate',
    subject: 'Certificate in Food Production',
    sessionType: 'practical',
    medium: 'English',
    gradeCompat: 11,
    suggestedFee: 40000,
  },
  // —— Health ——
  {
    id: 'health-nvq-nursing-aide',
    label: 'NVQ Level 4 — Nursing Aide',
    sector: 'health_sciences',
    qualificationLevel: 'nvq',
    subject: 'NVQ Level 4 — Nursing Aide',
    sessionType: 'clinical',
    medium: 'Sinhala',
    gradeCompat: 11,
    suggestedFee: 55000,
  },
  // —— Aviation ——
  {
    id: 'aviation-cabin-crew',
    label: 'Cabin Crew Initial Training',
    sector: 'aviation',
    qualificationLevel: 'certificate',
    subject: 'Cabin Crew Initial Training',
    sessionType: 'practical',
    medium: 'English',
    gradeCompat: 12,
    suggestedFee: 95000,
  },
  // —— Vocational ——
  {
    id: 'nvq-electrician',
    label: 'NVQ Level 4 — Electrician',
    sector: 'vocational_nvq',
    qualificationLevel: 'nvq',
    subject: 'NVQ Level 4 — Electrician',
    sessionType: 'practical',
    medium: 'Sinhala',
    gradeCompat: 11,
    suggestedFee: 35000,
  },
];

export function getSectorInfo(sector: AcademySector) {
  return ACADEMY_SECTORS.find((item) => item.id === sector);
}

export function getSessionTypeLabel(type: CourseSessionType) {
  return sessionLabels[type];
}

export function getQualificationLevelLabel(level: QualificationLevel) {
  return qualificationLabels[level];
}

export function findCourseTemplate(subject: string) {
  const maritime = MARITIME_COURSE_TEMPLATES.find(
    (template) => template.subject === subject || template.label === subject,
  );
  if (maritime) return maritime;
  return SL_COURSE_TEMPLATES.find((template) => template.subject === subject || template.label === subject);
}

export function usesCourseBasedClasses(instituteType: InstituteType | undefined | null) {
  return instituteType === 'academy' || instituteType === 'institute';
}

export function getTemplatesForSector(sector: AcademySector) {
  if (sector === 'maritime') return MARITIME_COURSE_TEMPLATES;
  return SL_COURSE_TEMPLATES.filter((template) => template.sector === sector);
}

/** @deprecated Use getTemplatesForSector */
export function getTemplatesForExamLevel(examLevel: ExamLevel) {
  return SL_COURSE_TEMPLATES.filter(
    (template) => template.sector === 'school_tuition' && template.examLevel === examLevel,
  );
}

export function formatClassMeta(
  subject: string,
  grade: number,
  medium: Medium,
  instituteType?: InstituteType | null,
) {
  if (isSchoolClassSubject(subject)) {
    return formatSchoolClassMeta(grade, medium, subject);
  }

  if (instituteType === 'solo' || instituteType === 'institute') {
    return formatSchoolClassMeta(grade, medium, subject);
  }

  const template = findCourseTemplate(subject);
  const courseBased = usesCourseBasedClasses(instituteType) || Boolean(template) || isStructuredCourseName(subject);

  if (template && courseBased) {
    if (template.sector === 'school_tuition' && template.examLevel) {
      return `${template.examLevel} • ${medium} • ${getSessionTypeLabel(template.sessionType)}`;
    }
    const qual = getQualificationLevelLabel(template.qualificationLevel);
    const session = getSessionTypeLabel(template.sessionType);
    return `${qual} • ${medium} • ${session}`;
  }

  if (courseBased && subject.includes(' — ')) {
    const [lead, tail] = subject.split(' — ');
    if (lead.startsWith('A/L ') || lead.startsWith('O/L ')) {
      return `${lead} • ${medium} • ${tail}`;
    }
    return `${lead} • ${medium}`;
  }

  if (courseBased && (subject.startsWith('Diploma') || subject.startsWith('NVQ') || subject.startsWith('Certificate'))) {
    return `${medium} medium`;
  }

  return `Grade ${grade} • ${medium} medium`;
}

function isStructuredCourseName(subject: string) {
  return (
    subject.startsWith('A/L ') ||
    subject.startsWith('O/L ') ||
    subject.startsWith('Grade 5 Scholarship') ||
    subject.startsWith('Diploma') ||
    subject.startsWith('NVQ') ||
    subject.startsWith('Certificate') ||
    subject.startsWith('STCW') ||
    subject.startsWith('HND') ||
    subject.startsWith('IELTS')
  );
}

/** School tuition exam levels only */
export const SCHOOL_EXAM_LEVEL_OPTIONS: ExamLevel[] = [
  'A/L',
  'O/L',
  'Grade 5 Scholarship',
  'London A/L',
  'Other',
];

export const DEFAULT_ACADEMY_SECTOR: AcademySector = 'school_tuition';
