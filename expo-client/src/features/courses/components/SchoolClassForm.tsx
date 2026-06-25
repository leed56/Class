import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildSchoolClassSubject,
  COMMON_SCHOOL_SUBJECTS,
  getSchoolSessionLabel,
  SCHOOL_GRADE_OPTIONS,
  SCHOOL_SESSION_OPTIONS,
  SchoolGrade,
  SchoolSessionType,
} from '@/features/courses/schoolSubjectModel';
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
  const preview = buildSchoolClassSubject(subjectName, sessionType);

  const mediumLabels = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  } as const;

  const sessionLabels = SCHOOL_SESSION_OPTIONS.map((item) => item.label);
  const selectedSessionLabel = getSchoolSessionLabel(sessionType);

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
        {COMMON_SCHOOL_SUBJECTS.map((item) => {
          const active = subjectName === item;
          return (
            <Pressable
              key={item}
              style={[styles.subjectChip, active && styles.subjectChipActive]}
              onPress={() => onSubjectNameChange(item)}
            >
              <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]} numberOfLines={1}>
                {item}
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
        selected={selectedSessionLabel}
        options={sessionLabels}
        onSelect={(label) => {
          const match = SCHOOL_SESSION_OPTIONS.find((item) => item.label === label);
          if (match) onSessionTypeChange(match.value);
        }}
      />

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>{t('classForm.classLabelPreview')}</Text>
          <Text style={styles.previewValue}>{preview}</Text>
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
