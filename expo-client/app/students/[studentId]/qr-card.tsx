import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { buildStudentQrPayload } from '@/features/attendance/qrAttendance';
import { generateQrDataUrl } from '@/features/attendance/qrCodeImage';
import { getStudentById } from '@/features/students/studentService';
import { Student } from '@/features/students/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function StudentQrCardScreen() {
  const params = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [workspaceId, setWorkspaceId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backHref = (`/students/${params.studentId}` as Href);

  const load = useCallback(async () => {
    if (!params.studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextStudent, workspace] = await Promise.all([
        getStudentById(params.studentId),
        getCurrentWorkspace(),
      ]);
      setStudent(nextStudent);
      setWorkspaceName(workspace?.name ?? 'Your workspace');
      if (!workspace?.id || !nextStudent) {
        setError('Student or workspace not found.');
        return;
      }
      setWorkspaceId(workspace.id);
      const nextPayload = buildStudentQrPayload({
        workspaceId: workspace.id,
        studentId: nextStudent.id,
      });
      setQrDataUrl(await generateQrDataUrl(nextPayload, 260));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load QR card.');
    } finally {
      setIsLoading(false);
    }
  }, [params.studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !student) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Student not found.'}</Text>
          <Link href={backHref} asChild>
            <Pressable style={styles.retryButton}>
              <Text style={styles.retryText}>Back to student</Text>
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
            <Text style={styles.title}>Student QR ID</Text>
            <Text style={styles.subtitle}>Print or save this card for fast class check-in.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{workspaceName}</Text>
          <Text style={styles.heroTitle}>{student.name}</Text>
          <Text style={styles.heroNote}>
            Grade {student.grade} • {student.medium}
          </Text>
        </LinearGradient>

        <PremiumCard style={styles.qrCard}>
          {qrDataUrl ? (
            <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <ActivityIndicator color={colors.primary} size="large" />
          )}
          <Text style={styles.qrHint}>Scan at class attendance to mark present instantly.</Text>
        </PremiumCard>

        <PremiumCard style={styles.metaCard}>
          <MetaRow label="Student" value={student.name} />
          <MetaRow label="Institute" value={workspaceName} />
          <MetaRow label="Workspace ID" value={workspaceId.slice(0, 8) + '…'} />
        </PremiumCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  qrCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  qrImage: { width: 260, height: 260 },
  qrHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  metaCard: { gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  metaLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  metaValue: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  retryButton: { borderRadius: radius.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  retryText: { color: 'white', fontSize: 13, fontWeight: '900' },
});
