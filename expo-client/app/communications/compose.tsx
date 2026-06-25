import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { loadAttendanceSheet } from '@/features/attendance/attendanceService';
import {
  createMessageDelivery,
  updateMessageDeliveryStatus,
} from '@/features/communications/communicationService';
import { getClassById } from '@/features/classes/classService';
import { getStudentById } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { buildAbsenceAlertMessage, openWhatsAppChat } from '@/lib/whatsapp';
import { formatLocalizedComposeClassLabel, interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type ComposeTarget = {
  studentId: string;
  studentName: string;
  parentPhone: string;
  consentCaptured: boolean;
};

function MessageComposeScreenContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{
    flow?: string;
    sessionId?: string;
    classId?: string;
    sessionDate?: string;
    studentIds?: string;
    deliveryId?: string;
    initialBody?: string;
    parentPhone?: string;
    studentId?: string;
    messageType?: string;
  }>();

  const [workspaceName, setWorkspaceName] = useState('');
  const [absenceTemplate, setAbsenceTemplate] = useState('');
  const [classLabel, setClassLabel] = useState('');
  const [sessionDateLabel, setSessionDateLabel] = useState('');
  const [targets, setTargets] = useState<ComposeTarget[]>([]);
  const [index, setIndex] = useState(0);
  const [messageBody, setMessageBody] = useState('');
  const [deliveryId, setDeliveryId] = useState<string | null>(params.deliveryId ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = targets[index] ?? null;
  const remaining = Math.max(targets.length - index, 0);
  const backHref = (params.classId ? `/classes/${params.classId}/attendance` : '/settings/communication') as Href;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await getCurrentWorkspace();
      const workspaceFallback = t('compose.workspaceFallback');
      const classFallback = t('compose.classFallback');
      setWorkspaceName(workspace?.name ?? workspaceFallback);
      setAbsenceTemplate(workspace?.absence_alert_template ?? '');

      if (params.flow === 'absence_batch' && params.classId && params.sessionId && params.studentIds) {
        const [tuitionClass, sheet] = await Promise.all([
          getClassById(params.classId),
          loadAttendanceSheet(params.classId, params.sessionDate),
        ]);
        const resolvedClassLabel = tuitionClass
          ? formatLocalizedComposeClassLabel(tuitionClass.subject, tuitionClass.grade, t)
          : classFallback;
        setClassLabel(resolvedClassLabel);
        setSessionDateLabel(sheet.sessionView.date);

        const ids = params.studentIds.split(',').filter(Boolean);
        const students = await Promise.all(ids.map((studentId) => getStudentById(studentId)));
        const rosterById = new Map(sheet.students.map((student) => [student.id, student]));

        const nextTargets = students
          .filter((student): student is Student => !!student)
          .map((student) => ({
            studentId: student.id,
            studentName: student.name,
            parentPhone: student.parentPhone,
            consentCaptured: rosterById.get(student.id)?.consentCaptured ?? student.consentCaptured,
          }));

        setTargets(nextTargets);
        if (nextTargets[0]) {
          setMessageBody(
            buildAbsenceAlertMessage({
              workspaceName: workspace?.name ?? workspaceFallback,
              studentName: nextTargets[0].studentName,
              className: resolvedClassLabel,
              sessionDate: sheet.sessionView.date,
              template: workspace?.absence_alert_template,
              t,
            }),
          );
        }
        return;
      }

      if (params.initialBody && params.parentPhone) {
        setTargets([
          {
            studentId: params.studentId ?? 'custom',
            studentName: t('compose.parentFallback'),
            parentPhone: params.parentPhone,
            consentCaptured: true,
          },
        ]);
        setMessageBody(params.initialBody);
        return;
      }

      setError(t('compose.nothingToCompose'));
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'compose.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [params.classId, params.flow, params.initialBody, params.parentPhone, params.sessionDate, params.sessionId, params.studentId, params.studentIds, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!current || params.flow !== 'absence_batch') return;
    setMessageBody(
      buildAbsenceAlertMessage({
        workspaceName,
        studentName: current.studentName,
        className: classLabel,
        sessionDate: sessionDateLabel,
        template: absenceTemplate,
        t,
      }),
    );
  }, [absenceTemplate, classLabel, current, index, params.flow, sessionDateLabel, t, workspaceName]);

  const progressLabel = useMemo(() => {
    if (targets.length <= 1) return t('compose.progressSingle');
    return interpolate(t('compose.progressMulti'), { current: index + 1, total: targets.length });
  }, [index, targets.length, t]);

  async function handleSend() {
    if (!current) return;
    if (!current.consentCaptured) {
      Alert.alert(t('compose.consentAlertTitle'), t('compose.consentAlertMessage'));
      return;
    }
    if (!messageBody.trim()) {
      setError(t('compose.emptyMessage'));
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      let activeDeliveryId = deliveryId;
      if (!activeDeliveryId) {
        const created = await createMessageDelivery({
          studentId: current.studentId,
          sessionId: params.sessionId ?? null,
          parentPhone: current.parentPhone,
          messageType: params.messageType === 'custom' ? 'custom' : 'absence_alert',
          body: messageBody.trim(),
          status: 'draft',
        });
        activeDeliveryId = created.id;
        setDeliveryId(created.id);
      }

      const opened = await openWhatsAppChat(current.parentPhone, messageBody.trim(), t);
      if (!opened) {
        await updateMessageDeliveryStatus(activeDeliveryId, 'failed', t('compose.whatsappFailed'));
        setError(t('compose.whatsappFailed'));
        return;
      }

      await updateMessageDeliveryStatus(activeDeliveryId, 'sent');
      goNext();
    } catch (sendError) {
      if (deliveryId) {
        await updateMessageDeliveryStatus(
          deliveryId,
          'failed',
          resolveServiceErrorMessage(sendError, t, 'compose.sendFailed'),
        );
      }
      setError(resolveServiceErrorMessage(sendError, t, 'compose.sendFailed'));
    } finally {
      setIsSending(false);
      setDeliveryId(null);
    }
  }

  async function handleSkip() {
    if (!current) return;
    try {
      await createMessageDelivery({
        studentId: current.studentId,
        sessionId: params.sessionId ?? null,
        parentPhone: current.parentPhone,
        messageType: 'absence_alert',
        body: messageBody.trim() || t('compose.skippedAbsenceBody'),
        status: 'skipped',
      });
      goNext();
    } catch (skipError) {
      setError(resolveServiceErrorMessage(skipError, t, 'compose.skipFailed'));
    }
  }

  function goNext() {
    if (index >= targets.length - 1) {
      router.replace(backHref);
      return;
    }
    setIndex((value) => value + 1);
    setDeliveryId(null);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !current) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>{t('compose.goBack')}</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) return null;

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
            <Text style={styles.title}>{t('compose.title')}</Text>
            <Text style={styles.subtitle}>{t('compose.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{progressLabel}</Text>
          <Text style={styles.heroTitle}>{current.studentName}</Text>
          <Text style={styles.heroNote}>{current.parentPhone}</Text>
        </LinearGradient>

        {!current.consentCaptured ? (
          <PremiumCard style={styles.warningCard}>
            <MaterialCommunityIcons name="shield-alert-outline" size={22} color={colors.warning} />
            <Text style={styles.warningText}>{t('compose.consentBlocked')}</Text>
          </PremiumCard>
        ) : null}

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('compose.messageTitle')}</Text>
          <TextInput
            value={messageBody}
            onChangeText={setMessageBody}
            multiline
            style={styles.messageInput}
            placeholder={t('compose.messagePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </PremiumCard>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.saveBar}>
        <View>
          <Text style={styles.saveLabel}>{t('compose.remaining')}</Text>
          <Text style={styles.saveValue}>{remaining}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isSending}>
            <Text style={styles.skipButtonText}>{t('compose.skip')}</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, (isSending || !current.consentCaptured) && styles.saveButtonDisabled]}
            onPress={handleSend}
            disabled={isSending || !current.consentCaptured}
          >
            {isSending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="whatsapp" size={18} color="white" />
                <Text style={styles.saveButtonText}>{t('compose.send')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function MessageComposeScreen() {
  return (
    <PermissionGate permission="take_attendance">
      <MessageComposeScreenContent />
    </PermissionGate>
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
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  warningCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.warningSoft },
  warningText: { flex: 1, color: colors.warning, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.md },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  messageInput: { minHeight: 180, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, color: colors.textPrimary, fontSize: 14, lineHeight: 21, fontWeight: '700', textAlignVertical: 'top' },
  inlineError: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  saveBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saveLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  saveValue: { marginTop: 3, color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skipButton: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, backgroundColor: colors.surface },
  skipButtonText: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  saveButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
