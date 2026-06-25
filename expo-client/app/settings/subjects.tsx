import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { listClasses } from '@/features/classes/classService';
import { TuitionClass } from '@/features/classes/models';
import { listStudents } from '@/features/students/studentService';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

function getSubjectSummary(
  classes: TuitionClass[],
  mediumLabels: Record<Medium, string>,
  gradeSingle: (grade: number) => string,
  gradeRange: (min: number, max: number) => string,
) {
  const bySubject = new Map<string, { grades: number[]; mediums: Set<string> }>();

  for (const item of classes) {
    const existing = bySubject.get(item.subject) ?? { grades: [], mediums: new Set<string>() };
    existing.grades.push(item.grade);
    existing.mediums.add(mediumLabels[item.medium as Medium] ?? item.medium);
    bySubject.set(item.subject, existing);
  }

  return Array.from(bySubject.entries()).map(([title, info]) => {
    const minGrade = Math.min(...info.grades);
    const maxGrade = Math.max(...info.grades);
    const grades = minGrade === maxGrade ? gradeSingle(minGrade) : gradeRange(minGrade, maxGrade);
    const medium = Array.from(info.mediums).join(' / ');
    return { title, grades, medium };
  });
}

const subjectColors = [colors.primary, colors.success, colors.warning, colors.info];

export default function SubjectSetupScreen() {
  return (
    <PermissionGate permission="manage_catalog">
      <SubjectSetupContent />
    </PermissionGate>
  );
}

function SubjectSetupContent() {
  const { t } = useI18n();
  const [classes, setClasses] = useState<TuitionClass[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextClasses, students] = await Promise.all([listClasses(), listStudents()]);
      setClasses(nextClasses);
      setTotalStudents(students.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects]),
  );

  const weeklyHours = classes.length * 2;
  const averageFee = classes.length
    ? Math.round(classes.reduce((sum, item) => sum + item.monthlyFee, 0) / classes.length)
    : 0;
  const subjects = useMemo(
    () =>
      getSubjectSummary(
        classes,
        mediumLabels,
        (grade) => interpolate(t('subjectsSetup.gradeSingle'), { grade }),
        (min, max) => interpolate(t('subjectsSetup.gradeRange'), { min, max }),
      ),
    [classes, mediumLabels, t],
  );

  const heroNote = isLoading
    ? ''
    : `${interpolate(t('subjectsSetup.heroNote'), { students: totalStudents, hours: weeklyHours })}${
        averageFee > 0 ? interpolate(t('subjectsSetup.heroAvgFee'), { amount: formatLkr(averageFee) }) : ''
      }`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t('subjectsSetup.title')}</Text>
            <Text style={styles.subtitle}>{t('subjectsSetup.subtitle')}</Text>
          </View>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="book-education-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t('subjectsSetup.heroLabel')}</Text>
            <Text style={styles.heroTitle}>
              {isLoading
                ? t('subjectsSetup.heroLoading')
                : interpolate(t('subjectsSetup.heroActiveClasses'), { count: classes.length })}
            </Text>
            {!isLoading ? <Text style={styles.heroNote}>{heroNote}</Text> : null}
          </View>
        </LinearGradient>

        <View style={styles.summaryRow}>
          <SetupMetric
            label={t('subjectsSetup.metricStudents')}
            value={isLoading ? '—' : `${totalStudents}`}
            icon="account-group-outline"
            color={colors.primary}
          />
          <SetupMetric
            label={t('subjectsSetup.metricWeeklyLoad')}
            value={isLoading ? '—' : `${weeklyHours}h`}
            icon="calendar-clock"
            color={colors.warning}
          />
        </View>

        <PremiumCard style={styles.subjectCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('subjectsSetup.subjectLibraryTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('subjectsSetup.subjectLibrarySubtitle')}</Text>
            </View>
            <View style={styles.smallAddButton}>
              <MaterialCommunityIcons name="plus" size={18} color="white" />
            </View>
          </View>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : subjects.length === 0 ? (
            <Text style={styles.emptyNote}>{t('subjectsSetup.emptySubjectsNote')}</Text>
          ) : (
            subjects.map((item, index) => (
              <View key={item.title}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <SubjectRow
                  title={item.title}
                  grades={item.grades}
                  medium={item.medium}
                  color={subjectColors[index % subjectColors.length]}
                />
              </View>
            ))
          )}
        </PremiumCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('subjectsSetup.sectionSchedules')}</Text>
          <Text style={styles.sectionAction}>{t('subjectsSetup.viewCalendar')}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : classes.length === 0 ? (
          <EmptyState
            icon="google-classroom"
            title={t('subjectsSetup.emptyClassesTitle')}
            message={t('subjectsSetup.emptyClassesMessage')}
            actionLabel={t('subjectsSetup.addClassAction')}
            actionHref="/classes/new"
          />
        ) : (
          <View style={styles.classList}>
            {classes.map((item) => {
              const medium = mediumLabels[item.medium as Medium] ?? item.medium;
              return (
                <PremiumCard key={item.id} style={styles.classCard}>
                  <View style={styles.classTopRow}>
                    <View style={styles.classIcon}>
                      <MaterialCommunityIcons name="google-classroom" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.classCopy}>
                      <Text style={styles.classTitle}>
                        {interpolate(t('subjectsSetup.classTitle'), { subject: item.subject, grade: item.grade })}
                      </Text>
                      <Text style={styles.classMeta}>
                        {medium} • {item.hall}
                      </Text>
                    </View>
                    <View style={styles.feePill}>
                      <Text style={styles.feePillText}>{formatLkr(item.monthlyFee)}</Text>
                    </View>
                  </View>
                  <View style={styles.classStatsRow}>
                    <ClassStat label={t('subjectsSetup.statSchedule')} value={`${item.day} ${item.startTime}`} />
                    <ClassStat label={t('subjectsSetup.statStudents')} value={`${item.enrolledCount}`} />
                    <ClassStat label={t('subjectsSetup.statAttendance')} value={`${item.attendanceAverage}%`} />
                  </View>
                </PremiumCard>
              );
            })}
          </View>
        )}

        <PremiumCard style={styles.defaultsCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>{t('subjectsSetup.defaultsTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('subjectsSetup.defaultsSubtitle')}</Text>
            </View>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.primary} />
          </View>
          <RuleRow icon="cash" label={t('subjectsSetup.ruleFeeCycle')} value={t('subjectsSetup.ruleFeeCycleValue')} />
          <View style={styles.divider} />
          <RuleRow icon="bell-ring-outline" label={t('subjectsSetup.ruleReminderDay')} value={t('subjectsSetup.ruleReminderDayValue')} />
          <View style={styles.divider} />
          <RuleRow
            icon="map-marker-outline"
            label={t('subjectsSetup.ruleDefaultLocation')}
            value={classes[0]?.hall ?? t('subjectsSetup.mainHallFallback')}
          />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SetupMetric({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <PremiumCard style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </PremiumCard>
  );
}

function SubjectRow({ title, grades, medium, color }: { title: string; grades: string; medium: string; color: string }) {
  return (
    <View style={styles.subjectRow}>
      <View style={[styles.subjectIcon, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name="book-open-page-variant-outline" size={21} color={color} />
      </View>
      <View style={styles.subjectCopy}>
        <Text style={styles.subjectTitle}>{title}</Text>
        <Text style={styles.subjectMeta}>
          {grades} • {medium}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
    </View>
  );
}

function ClassStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.classStatBox}>
      <Text style={styles.classStatLabel}>{label}</Text>
      <Text style={styles.classStatValue}>{value}</Text>
    </View>
  );
}

function RuleRow({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.ruleCopy}>
        <Text style={styles.ruleLabel}>{label}</Text>
        <Text style={styles.ruleValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
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
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  metricCard: { flex: 1, padding: spacing.lg, gap: spacing.xs },
  metricIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  metricValue: { fontSize: 25, fontWeight: '900' },
  subjectCard: { gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.sm },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  smallAddButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  subjectIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  subjectCopy: { flex: 1 },
  subjectTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  subjectMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  sectionAction: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  classList: { gap: spacing.md },
  classCard: { gap: spacing.lg },
  classTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  classIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  classCopy: { flex: 1 },
  classTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  classMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  feePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.successSoft },
  feePillText: { color: colors.success, fontSize: 10, fontWeight: '900' },
  classStatsRow: { flexDirection: 'row', gap: spacing.sm },
  classStatBox: { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.background },
  classStatLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  classStatValue: { marginTop: 4, color: colors.textPrimary, fontSize: 11, fontWeight: '900' },
  defaultsCard: { gap: spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  ruleIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  ruleCopy: { flex: 1 },
  ruleLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  ruleValue: { marginTop: 3, color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  loader: { paddingVertical: spacing.lg },
  emptyNote: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', paddingVertical: spacing.md },
});
