import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { createOneOffInvoice } from '@/features/fees/feeService';
import { listStudentEnrollments, StudentEnrollmentEntry } from '@/features/enrollment/enrollmentService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { getStudentById, listStudents } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { InvoiceType } from '@/lib/database.types';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type ChargeType = Extract<InvoiceType, 'material' | 'exam'>;

const GENERAL_CLASS = 'General';

function IssueChargeScreenContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(params.studentId ?? '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentEntry[]>([]);
  const [chargeType, setChargeType] = useState<ChargeType>('material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [classLabel, setClassLabel] = useState(GENERAL_CLASS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScreen = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const roster = await listStudents();
      setStudents(roster);

      const initialStudentId = params.studentId ?? roster[0]?.id ?? '';
      setSelectedStudentId(initialStudentId);

      if (initialStudentId) {
        const [student, nextEnrollments] = await Promise.all([
          getStudentById(initialStudentId),
          listStudentEnrollments(initialStudentId),
        ]);
        setSelectedStudent(student);
        setEnrollments(nextEnrollments);
        setClassLabel(GENERAL_CLASS);
      }
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'issueCharge.loadStudentsFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId, t]);

  const classValues = [GENERAL_CLASS, ...enrollments.map((entry) => `${entry.tuitionClass.subject} G${entry.tuitionClass.grade}`)];
  const classLabels = [t('issueCharge.generalClass'), ...enrollments.map((entry) => `${entry.tuitionClass.subject} G${entry.tuitionClass.grade}`)];

  function resolveClassId(label: string) {
    if (label === GENERAL_CLASS) return null;
    const entry = enrollments.find((item) => `${item.tuitionClass.subject} G${item.tuitionClass.grade}` === label);
    return entry?.tuitionClass.id ?? null;
  }

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  async function handleStudentChange(studentId: string) {
    setSelectedStudentId(studentId);
    setError(null);
    try {
      const [student, nextEnrollments] = await Promise.all([
        getStudentById(studentId),
        listStudentEnrollments(studentId),
      ]);
      setSelectedStudent(student);
      setEnrollments(nextEnrollments);
      setClassLabel(GENERAL_CLASS);
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'issueCharge.loadStudentFailed'));
    }
  }

  async function handleSave() {
    if (!selectedStudentId) {
      setError(t('issueCharge.selectStudentFirst'));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const invoiceId = await createOneOffInvoice({
        studentId: selectedStudentId,
        invoiceType: chargeType,
        description,
        amountLkr: Number(amount),
        classId: resolveClassId(classLabel),
      });
      router.replace(`/fees/record-payment?studentId=${selectedStudentId}&invoiceId=${invoiceId}` as Href);
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'issueCharge.issueFailed'));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmSave() {
    if (!selectedStudent) return;
    Alert.alert(
      t('issueCharge.confirmTitle'),
      interpolate(t('issueCharge.confirmMessage'), {
        type: chargeType === 'material' ? t('issueCharge.material') : t('issueCharge.exam'),
        amount: `LKR ${Number(amount || 0).toLocaleString('en-LK')}`,
        name: selectedStudent.name,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('issueCharge.issueButton'), onPress: handleSave },
      ],
    );
  }

  const backHref = params.studentId ? (`/students/${params.studentId}` as Href) : ('/(tabs)/fees' as Href);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (students.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('issueCharge.noStudents')}</Text>
          <Link href="/students/new" asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('issueCharge.addStudent')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href={backHref} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('issueCharge.title')}</Text>
            <Text style={styles.subtitle}>{t('issueCharge.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="file-document-plus-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('issueCharge.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{selectedStudent?.name ?? t('issueCharge.selectStudent')}</Text>
            <Text style={styles.heroNote}>{t('issueCharge.heroNote')}</Text>
          </View>
        </LinearGradient>

        <PremiumCard style={styles.formCard}>
          <Text style={styles.cardTitle}>{t('issueCharge.studentCard')}</Text>
          {!params.studentId ? (
            <View style={styles.chipGroup}>
              <Text style={styles.chipLabel}>{t('issueCharge.chooseStudent')}</Text>
              <View style={styles.chipRow}>
                {students.map((student) => {
                  const active = student.id === selectedStudentId;
                  return (
                    <Pressable
                      key={student.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => handleStudentChange(student.id)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                        {student.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text style={styles.studentName}>{selectedStudent?.name}</Text>
          )}
        </PremiumCard>

        <PremiumCard style={styles.formCard}>
          <Text style={styles.cardTitle}>{t('issueCharge.chargeTypeTitle')}</Text>
          <View style={styles.typeRow}>
            <TypeChip
              label={t('issueCharge.material')}
              icon="notebook-outline"
              active={chargeType === 'material'}
              onPress={() => setChargeType('material')}
            />
            <TypeChip
              label={t('issueCharge.exam')}
              icon="file-certificate-outline"
              active={chargeType === 'exam'}
              onPress={() => setChargeType('exam')}
            />
          </View>
          <FormTextField
            label={t('issueCharge.descriptionLabel')}
            placeholder={chargeType === 'material' ? t('issueCharge.materialPlaceholder') : t('issueCharge.examPlaceholder')}
            icon="text-box-outline"
            value={description}
            onChangeText={setDescription}
          />
          <FormTextField
            label={t('issueCharge.amountLabel')}
            placeholder={t('issueCharge.amountPlaceholder')}
            icon="cash"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </PremiumCard>

        {enrollments.length > 0 ? (
          <PremiumCard style={styles.formCard}>
            <Text style={styles.cardTitle}>{t('issueCharge.linkClassTitle')}</Text>
            <Text style={styles.cardSubtitle}>{t('issueCharge.linkClassSubtitle')}</Text>
            <ChoiceChipGroup
              label={t('issueCharge.classLabel')}
              options={classLabels}
              selected={classLabel === GENERAL_CLASS ? t('issueCharge.generalClass') : classLabel}
              onSelect={(label) => {
                const index = classLabels.indexOf(label);
                if (index >= 0) setClassLabel(classValues[index] ?? GENERAL_CLASS);
              }}
            />
          </PremiumCard>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('issueCharge.chargeTotal')}</Text>
          <Text style={styles.saveValue}>LKR {Number(amount || 0).toLocaleString('en-LK')}</Text>
        </View>
        <Pressable style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={confirmSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-send-outline" size={18} color="white" />
              <Text style={styles.saveButtonText}>{t('issueCharge.issueCollect')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function IssueChargeScreen() {
  return (
    <PermissionGate permission="record_payments">
      <IssueChargeScreenContent />
    </PermissionGate>
  );
}

function TypeChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.typeChip, active && styles.typeChipActive]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={18} color={active ? 'white' : colors.textSecondary} />
      <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  formCard: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  studentName: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  chipGroup: { gap: spacing.sm },
  chipLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, maxWidth: '100%' },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  chipTextActive: { color: 'white' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '900' },
  typeChipTextActive: { color: 'white' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
