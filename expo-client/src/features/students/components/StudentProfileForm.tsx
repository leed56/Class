import { StyleSheet, Text, View } from 'react-native';

import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import {
  ACADEMY_STUDENT_GRADE_PLACEHOLDER,
  SCHOOL_STUDENT_GRADE_OPTIONS,
  usesSchoolStudentFields,
} from '@/features/students/studentProfileModel';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

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
  const schoolMode = usesSchoolStudentFields(workspaceType, academySector);

  return (
    <View style={styles.wrap}>
      <FormTextField
        label="Student name"
        placeholder="Kavindu Perera"
        icon="account-outline"
        value={fullName}
        onChangeText={onFullNameChange}
      />
      {schoolMode ? (
        <>
          <FormTextField
            label="School"
            placeholder="Ananda College"
            icon="school-outline"
            value={school}
            onChangeText={onSchoolChange}
          />
          <ChoiceChipGroup
            label="Grade (1–13, up to A/L)"
            selected={grade}
            options={SCHOOL_STUDENT_GRADE_OPTIONS}
            onSelect={onGradeChange}
          />
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            Professional academy — no school grade. Enrol trainees by programme, not O/L/A/L class.
          </Text>
          <FormTextField
            label="Entry qualification (optional)"
            placeholder="e.g. O/L passed, deck rating applicant, NVQ 4"
            icon="certificate-outline"
            value={school}
            onChangeText={onSchoolChange}
          />
        </>
      )}
      <ChoiceChipGroup
        label="Medium"
        selected={medium}
        options={['English', 'Sinhala', 'Tamil']}
        onSelect={(value) => onMediumChange(value as Medium)}
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
