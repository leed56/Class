import {
  CourseSessionType,
  ExamLevel,
  findCourseTemplate,
  QualificationLevel,
  usesCourseBasedClasses,
} from '@/features/courses/slCourseModel';
import {
  isSchoolClassSubject,
  parseSchoolClassSubject,
} from '@/features/courses/schoolSubjectModel';
import { usesSchoolStudentFields } from '@/features/students/studentProfileModel';
import { getLocalizedExamLevelLabel } from '@/i18n/coursePickerLabels';
import { getLocalizedSchoolSubjectLabel } from '@/i18n/schoolSubjectLabels';
import { interpolate } from '@/i18n/format';
import { InstituteType, Medium } from '@/lib/database.types';

type Translate = (path: string) => string;

const SCHOOL_NOT_SET = 'School not set';

function localizedMedium(medium: Medium, t: Translate) {
  if (medium === 'Sinhala') return t('settings.sinhala');
  if (medium === 'Tamil') return t('settings.tamil');
  return t('settings.english');
}

function localizedGradeLabel(grade: number, t: Translate) {
  if (grade >= 12) {
    return interpolate(t('classMeta.gradeAlPrep'), { grade });
  }
  if (grade >= 10) {
    return interpolate(t('classMeta.gradeOlPrep'), { grade });
  }
  return interpolate(t('classMeta.grade'), { grade });
}

export function getLocalizedCourseSessionLabel(type: CourseSessionType, t: Translate) {
  return t(`courseSessionTypes.${type}`);
}

export function getLocalizedQualificationLevelLabel(level: QualificationLevel, t: Translate) {
  return t(`qualificationLevels.${level}`);
}

function localizedSchoolClassMeta(grade: number, medium: Medium, subject: string, t: Translate) {
  const parsed = parseSchoolClassSubject(subject);
  const subjectLabel = getLocalizedSchoolSubjectLabel(parsed.subjectName, t);
  return `${localizedGradeLabel(grade, t)} • ${localizedMedium(medium, t)} • ${subjectLabel}`;
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

export function formatLocalizedClassMeta(
  subject: string,
  grade: number,
  medium: Medium,
  instituteType: InstituteType | null | undefined,
  t: Translate,
) {
  const mediumLabel = localizedMedium(medium, t);

  if (isSchoolClassSubject(subject)) {
    return localizedSchoolClassMeta(grade, medium, subject, t);
  }

  if (instituteType === 'solo' || instituteType === 'institute') {
    return localizedSchoolClassMeta(grade, medium, subject, t);
  }

  const template = findCourseTemplate(subject);
  const courseBased = usesCourseBasedClasses(instituteType) || Boolean(template) || isStructuredCourseName(subject);

  if (template && courseBased) {
    if (template.sector === 'school_tuition' && template.examLevel) {
      return interpolate(t('classMeta.examSession'), {
        examLevel: getLocalizedExamLevelLabel(template.examLevel as ExamLevel, t),
        medium: mediumLabel,
        session: getLocalizedCourseSessionLabel(template.sessionType, t),
      });
    }

    return interpolate(t('classMeta.qualificationSession'), {
      qualification: getLocalizedQualificationLevelLabel(template.qualificationLevel, t),
      medium: mediumLabel,
      session: getLocalizedCourseSessionLabel(template.sessionType, t),
    });
  }

  if (courseBased && subject.includes(' — ')) {
    const [lead, tail] = subject.split(' — ');
    if (lead.startsWith('A/L ') || lead.startsWith('O/L ')) {
      return interpolate(t('classMeta.subjectMediumTail'), { lead, medium: mediumLabel, tail });
    }
    return interpolate(t('classMeta.subjectMedium'), { subject: lead, medium: mediumLabel });
  }

  if (courseBased && (subject.startsWith('Diploma') || subject.startsWith('NVQ') || subject.startsWith('Certificate'))) {
    return interpolate(t('classMeta.mediumOnly'), { medium: mediumLabel });
  }

  return interpolate(t('classMeta.gradeMedium'), { grade, medium: mediumLabel });
}

export function formatLocalizedStudentMeta(
  grade: number,
  medium: Medium,
  school: string,
  workspaceType: InstituteType | null | undefined,
  academySector: string | null | undefined,
  t: Translate,
) {
  const mediumLabel = localizedMedium(medium, t);
  const schoolLabel =
    school && school !== SCHOOL_NOT_SET
      ? school
      : t('classMeta.schoolNotSet');

  if (!usesSchoolStudentFields(workspaceType, academySector)) {
    return school && school !== SCHOOL_NOT_SET
      ? interpolate(t('classMeta.studentAcademy'), { medium: mediumLabel, school: schoolLabel })
      : mediumLabel;
  }

  return interpolate(t('classMeta.studentSchool'), {
    grade,
    medium: mediumLabel,
    school: schoolLabel,
  });
}

export function formatLocalizedComposeClassLabel(subject: string, grade: number, t: Translate) {
  return interpolate(t('classMeta.composeClass'), { subject, grade });
}
