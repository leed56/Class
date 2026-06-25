import { StyleSheet, Text, View } from 'react-native';

import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import {
  ACADEMY_STUDENT_GRADE_PLACEHOLDER,
  SCHOOL_STUDENT_GRADE_OPTIONS,
  usesSchoolStudentFields,
} from '@/features/students/studentProfileModel';
import { useI18n } from '@/i18n/I18nProvider';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const MEDIUM_VALUES = ['English', 'Sinhala', 'Tamil'] as const;

type Props = {
  workspaceType: InstituteType;
  academySector?: string | null;
  fullName: string;
  school: string;
  grade: string;
  medium: Medium;
  onFullNameChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onMediumChange: (value: Medium) => void;
};

export function StudentProfileForm({
  workspaceType,
  academySector,
  fullName,
  school,
  grade,
  medium,
  onFullNameChange,
  onSchoolChange,
  onGradeChange,
  onMediumChange,
}: Props) {
  const { t } = useI18n();
  const schoolMode = usesSchoolStudentFields(workspaceType, academySector);

  const mediumLabels = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  } as const;

  return (
    <View style={styles.wrap}>
      <FormTextField
        label={t('studentForm.studentNameLabel')}
        placeholder={t('studentForm.studentNamePlaceholder')}
        icon="account-outline"
        value={fullName}
        onChangeText={onFullNameChange}
      />
      {schoolMode ? (
        <>
          <FormTextField
            label={t('studentForm.schoolLabel')}
            placeholder={t('studentForm.schoolPlaceholder')}
            icon="school-outline"
            value={school}
            onChangeText={onSchoolChange}
          />
          <ChoiceChipGroup
            label={t('studentForm.gradeLabel')}
            selected={grade}
            options={SCHOOL_STUDENT_GRADE_OPTIONS}
            onSelect={onGradeChange}
          />
        </>
      ) : (
        <>
          <Text style={styles.hint}>{t('studentForm.academyHint')}</Text>
          <FormTextField
            label={t('studentForm.entryQualificationLabel')}
            placeholder={t('studentForm.entryQualificationPlaceholder')}
            icon="certificate-outline"
            value={school}
            onChangeText={onSchoolChange}
          />
        </>
      )}
      <ChoiceChipGroup
        label={t('studentForm.mediumLabel')}
        selected={mediumLabels[medium]}
        options={MEDIUM_VALUES.map((value) => mediumLabels[value])}
        onSelect={(label) => {
          const match = MEDIUM_VALUES.find((value) => mediumLabels[value] === label);
          if (match) onMediumChange(match);
        }}
      />
    </View>
  );
}

export function resolveStudentGradeForSave(
  workspaceType: InstituteType,
  academySector: string | null | undefined,
  grade: string,
) {
  if (usesSchoolStudentFields(workspaceType, academySector)) {
    return Number(grade);
  }
  return ACADEMY_STUDENT_GRADE_PLACEHOLDER;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  hint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
