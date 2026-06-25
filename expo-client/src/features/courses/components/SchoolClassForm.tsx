import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  SCHOOL_GRADE_OPTIONS,
  SchoolGrade,
  SchoolSessionType,
} from '@/features/courses/schoolSubjectModel';
import { getLocalizedSchoolSessionLabel, listLocalizedSchoolSessionOptions, listLocalizedSchoolSubjects } from '@/i18n';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const MEDIUM_VALUES = ['English', 'Sinhala', 'Tamil'] as const;

type Props = {
  subjectName: string;
  grade: SchoolGrade;
  medium: Medium;
  sessionType: SchoolSessionType;
  onSubjectNameChange: (value: string) => void;
  onGradeChange: (value: SchoolGrade) => void;
  onMediumChange: (value: Medium) => void;
  onSessionTypeChange: (value: SchoolSessionType) => void;
  showBuildingHint?: boolean;
};

export function SchoolClassForm({
  subjectName,
  grade,
  medium,
  sessionType,
  onSubjectNameChange,
  onGradeChange,
  onMediumChange,
  onSessionTypeChange,
  showBuildingHint = false,
}: Props) {
  const { t } = useI18n();
  const localizedPreview = subjectName.trim()
    ? `${subjectName.trim()} — ${getLocalizedSchoolSessionLabel(sessionType, t)}`
    : '';
  const sessionOptions = useMemo(() => listLocalizedSchoolSessionOptions(t), [t]);
  const subjectOptions = useMemo(() => listLocalizedSchoolSubjects(t), [t]);

  const mediumLabels = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  } as const;

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{showBuildingHint ? t('classForm.schoolHintBuilding') : t('classForm.schoolHintSolo')}</Text>

      <FormTextField
        label={t('classForm.subjectNameLabel')}
        placeholder={t('classForm.subjectNamePlaceholder')}
        icon="book-open-page-variant"
        value={subjectName}
        onChangeText={onSubjectNameChange}
      />

      <Text style={styles.chipLabel}>{t('classForm.quickPickSubject')}</Text>
      <View style={styles.subjectGrid}>
        {subjectOptions.map((item) => {
          const active = subjectName === item.value;
          return (
            <Pressable
              key={item.value}
              style={[styles.subjectChip, active && styles.subjectChipActive]}
              onPress={() => onSubjectNameChange(item.value)}
            >
              <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ChoiceChipGroup
        label={t('classForm.gradeLabel')}
        selected={grade}
        options={[...SCHOOL_GRADE_OPTIONS]}
        onSelect={(value) => onGradeChange(value as SchoolGrade)}
      />

      <ChoiceChipGroup
        label={t('classForm.mediumLabel')}
        selected={mediumLabels[medium]}
        options={MEDIUM_VALUES.map((value) => mediumLabels[value])}
        onSelect={(label) => {
          const match = MEDIUM_VALUES.find((value) => mediumLabels[value] === label);
          if (match) onMediumChange(match);
        }}
      />

      <ChoiceChipGroup
        label={t('classForm.classTypeLabel')}
        selected={sessionType}
        options={sessionOptions}
        onSelect={(value) => onSessionTypeChange(value as SchoolSessionType)}
      />

      {localizedPreview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>{t('classForm.classLabelPreview')}</Text>
          <Text style={styles.previewValue}>{localizedPreview}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  chipLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  subjectChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.background,
    maxWidth: '48%',
  },
  subjectChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  subjectChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  subjectChipTextActive: { color: colors.primary },
  preview: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
  },
  previewLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  previewValue: { marginTop: 4, color: colors.primary, fontSize: 13, fontWeight: '900' },
});
