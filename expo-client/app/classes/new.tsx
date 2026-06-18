import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { createClass } from '@/features/classes/classService';
import { CourseTemplatePicker } from '@/features/courses/components/CourseTemplatePicker';
import { SchoolClassForm } from '@/features/courses/components/SchoolClassForm';
import { MARITIME_COURSE_TEMPLATES } from '@/features/courses/maritimeCourseModel';
import {
  AcademySector,
  DEFAULT_ACADEMY_SECTOR,
  ExamLevel,
  findCourseTemplate,
  SlCourseTemplate,
  SL_COURSE_TEMPLATES,
} from '@/features/courses/slCourseModel';
import {
  buildSchoolClassSubject,
  gradeToNumber,
  SchoolGrade,
  SchoolSessionType,
  usesSchoolClassForm,
} from '@/features/courses/schoolSubjectModel';
import { HallPicker } from '@/features/locations/components/HallPicker';
import { ScheduleConflictBanner } from '@/features/locations/components/ScheduleConflictBanner';
import { ScheduleConflict } from '@/features/locations/models';
import { findHallScheduleConflicts } from '@/features/locations/timetableService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { InstituteType, Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const ALL_COURSE_TEMPLATES = [...SL_COURSE_TEMPLATES, ...MARITIME_COURSE_TEMPLATES];

export default function NewClassScreen() {
  const router = useRouter();
  const [workspaceType, setWorkspaceType] = useState<InstituteType>('solo');
  const [subjectName, setSubjectName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<SchoolGrade>('9');
  const [medium, setMedium] = useState<Medium>('English');
  const [sessionType, setSessionType] = useState<SchoolSessionType>('theory');
  const [sector, setSector] = useState<AcademySector>(DEFAULT_ACADEMY_SECTOR);
  const [examLevel, setExamLevel] = useState<ExamLevel>('A/L');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [hallId, setHallId] = useState<string | null>(null);
  const [weekday, setWeekday] = useState('Monday');
  const [startTime, setStartTime] = useState('10:30 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [monthlyFee, setMonthlyFee] = useState('2500');
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schoolMode = usesSchoolClassForm(workspaceType, sector);

  useEffect(() => {
    getCurrentWorkspace()
      .then((workspace) => {
        const type = workspace?.institute_type ?? 'solo';
        setWorkspaceType(type);
        if (workspace?.academy_sector) {
          setSector(workspace.academy_sector as AcademySector);
        } else if (type === 'institute' || type === 'solo') {
          setSector('school_tuition');
        }
      })
      .catch(() => setWorkspaceType('solo'));
  }, []);

  useEffect(() => {
    if (!schoolMode) return;
    setSubject(buildSchoolClassSubject(subjectName, sessionType));
  }, [schoolMode, subjectName, sessionType]);

  useEffect(() => {
    if (!hallId) {
      setConflicts([]);
      return;
    }

    let active = true;
    findHallScheduleConflicts({ hallId, weekday, startTime, endTime })
      .then((nextConflicts) => {
        if (active) setConflicts(nextConflicts);
      })
      .catch(() => {
        if (active) setConflicts([]);
      });

    return () => {
      active = false;
    };
  }, [endTime, hallId, startTime, weekday]);

  function handleSelectTemplate(template: SlCourseTemplate) {
    setSelectedTemplateId(template.id);
    setSubject(template.subject);
    setGrade(String(template.gradeCompat) as SchoolGrade);
    setMedium(template.medium);
    setMonthlyFee(String(template.suggestedFee));
  }

  async function handleSave() {
    setError(null);

    const storedSubject = schoolMode ? buildSchoolClassSubject(subjectName, sessionType) : subject.trim();
    const template =
      !schoolMode && selectedTemplateId
        ? ALL_COURSE_TEMPLATES.find((item) => item.id === selectedTemplateId) ?? findCourseTemplate(storedSubject)
        : null;

    if (!storedSubject) {
      setError(schoolMode ? 'Enter a subject name.' : 'Select or enter a course name.');
      return;
    }
    if (workspaceType === 'institute' && !hallId) {
      setError('Select a hall slot for this class.');
      return;
    }

    setSubmitting(true);
    try {
      await createClass({
        subject: storedSubject,
        grade: gradeToNumber(grade),
        medium,
        hallId,
        weekday,
        startTime,
        endTime,
        monthlyFee: Number(monthlyFee) || 0,
        sector: schoolMode ? 'school_tuition' : (template?.sector ?? sector),
        sessionType: schoolMode ? sessionType : template?.sessionType ?? 'theory',
        qualificationLevel: schoolMode ? 'school_session' : template?.qualificationLevel ?? 'certificate',
        intakeLabel: template?.intakeLabel ?? null,
      });
      router.replace('/(tabs)/classes');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save class.');
    } finally {
      setSubmitting(false);
    }
  }

  const title = schoolMode ? 'Create Class' : 'Create Course';
  const saveLabel = schoolMode ? 'Save Class' : 'Save Course';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href="/(tabs)/classes" asChild>
            <Pressable style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {schoolMode
                ? workspaceType === 'institute'
                  ? 'Any subject, grade 1–13, all mediums. Book a hall — students pay you directly.'
                  : 'Any school subject up to A/L, all mediums. Set schedule and monthly fee.'
                : 'Pick sector, programme, schedule and fee for your academy course.'}
            </Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{schoolMode ? 'School tuition' : 'Academy course'}</Text>
          <Text style={styles.heroTitle}>
            {schoolMode
              ? 'Grades 1–13 • English, Sinhala & Tamil • teacher picks subject'
              : 'Maritime, IT, gemology, counselling & more'}
          </Text>
          <Text style={styles.heroNote}>
            {workspaceType === 'institute'
              ? 'Building admin manages halls. You manage your students and tuition fees.'
              : schoolMode
                ? 'Type any subject — theory, revision, paper or mass lecture.'
                : 'Students enroll into this programme for attendance and fees.'}
          </Text>
        </LinearGradient>

        <ScheduleConflictBanner conflicts={conflicts} />

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{schoolMode ? 'Class details' : 'Course details'}</Text>
          {schoolMode ? (
            <SchoolClassForm
              subjectName={subjectName}
              grade={grade}
              medium={medium}
              sessionType={sessionType}
              onSubjectNameChange={setSubjectName}
              onGradeChange={setGrade}
              onMediumChange={setMedium}
              onSessionTypeChange={setSessionType}
              showBuildingHint={workspaceType === 'institute'}
            />
          ) : (
            <>
              <CourseTemplatePicker
                sector={sector}
                onSectorChange={setSector}
                selectedTemplateId={selectedTemplateId}
                examLevel={examLevel}
                onExamLevelChange={setExamLevel}
                onSelectTemplate={handleSelectTemplate}
              />
              <FormTextField
                label="Course / programme name"
                placeholder="STCW Basic Safety, Diploma in Counselling"
                icon="book-education-outline"
                value={subject}
                onChangeText={(value) => {
                  setSubject(value);
                  const match = ALL_COURSE_TEMPLATES.find((item) => item.subject === value);
                  setSelectedTemplateId(match?.id ?? null);
                }}
              />
              <ChoiceChipGroup
                label="Medium"
                selected={medium}
                options={['English', 'Sinhala', 'Tamil']}
                onSelect={(value) => setMedium(value as Medium)}
              />
            </>
          )}
          {workspaceType === 'institute' || workspaceType === 'academy' ? (
            <HallPicker selectedHallId={hallId} onSelect={(nextHallId) => setHallId(nextHallId)} />
          ) : null}
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Schedule & fee</Text>
          <ChoiceChipGroup
            label="Day"
            selected={weekday}
            options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
            onSelect={setWeekday}
          />
          <FormTextField label="Start time" placeholder="10:30 AM" icon="clock-outline" value={startTime} onChangeText={setStartTime} />
          <FormTextField label="End time" placeholder="12:00 PM" icon="clock-outline" value={endTime} onChangeText={setEndTime} />
          <FormTextField label="Monthly fee (LKR)" placeholder="2500" icon="cash" keyboardType="number-pad" value={monthlyFee} onChangeText={setMonthlyFee} />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <Text style={styles.saveValue}>Saved to your workspace on submit</Text>
        <Pressable style={[styles.saveButton, submitting && styles.saveButtonDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{saveLabel}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 116, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveValue: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveButton: { height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, minWidth: 120 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
});
