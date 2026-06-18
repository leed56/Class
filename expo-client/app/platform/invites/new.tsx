import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { ACADEMY_SECTORS, AcademySector } from '@/features/courses/slCourseModel';
import { buildInviteUrl, createPlatformInvite } from '@/features/platform/platformService';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const instituteTypes: { value: InstituteType; label: string }[] = [
  { value: 'solo', label: 'Solo tutor' },
  { value: 'academy', label: 'Academy' },
  { value: 'institute', label: 'Tuition building' },
];

export default function NewPlatformInviteScreen() {
  const router = useRouter();
  const [instituteType, setInstituteType] = useState<InstituteType>('academy');
  const [academySector, setAcademySector] = useState('maritime');
  const [workspaceNameHint, setWorkspaceNameHint] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    setInviteUrl(null);
    try {
      const result = await createPlatformInvite({
        instituteType,
        academySector: instituteType === 'academy' ? (academySector as AcademySector) : null,
        workspaceNameHint,
        email,
        note,
      });
      setInviteUrl(buildInviteUrl(result.token));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not create invite.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Link href={'/platform/index' as Href} asChild>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>
          </Link>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Customer invite</Text>
            <Text style={styles.subtitle}>Pre-set workspace type and sector for assisted onboarding.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroTitle}>Provision a new customer</Text>
          <Text style={styles.heroNote}>Share the link after signup — onboarding will lock type and sector.</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.label}>Workspace type</Text>
          <View style={styles.chipRow}>
            {instituteTypes.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.chip, instituteType === option.value && styles.chipActive]}
                onPress={() => setInstituteType(option.value)}
              >
                <Text style={[styles.chipText, instituteType === option.value && styles.chipTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {instituteType === 'academy' ? (
            <>
              <Text style={styles.label}>Academy sector</Text>
              <View style={styles.chipRow}>
                {ACADEMY_SECTORS.map((sector) => (
                  <Pressable
                    key={sector.id}
                    style={[styles.chip, academySector === sector.id && styles.chipActive]}
                    onPress={() => setAcademySector(sector.id)}
                  >
                    <Text style={[styles.chipText, academySector === sector.id && styles.chipTextActive]}>{sector.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Suggested workspace name</Text>
          <TextInput
            value={workspaceNameHint}
            onChangeText={setWorkspaceNameHint}
            placeholder="Colombo Maritime Academy"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Lock to email (optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="director@academy.lk"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Internal note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Pilot customer — June 2026"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {inviteUrl ? (
          <PremiumCard style={styles.successCard}>
            <Text style={styles.successTitle}>Invite created</Text>
            <Text style={styles.successUrl}>{inviteUrl}</Text>
            <View style={styles.successActions}>
              <Pressable style={styles.copyButton} onPress={() => void copyLink()}>
                <Text style={styles.copyButtonText}>Copy link</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={() => router.replace('/platform/index' as Href)}>
                <Text style={styles.doneButtonText}>Back to admin</Text>
              </Pressable>
            </View>
          </PremiumCard>
        ) : (
          <Pressable style={[styles.createButton, submitting && styles.createButtonDisabled]} onPress={() => void handleCreate()} disabled={submitting}>
            {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.createButtonText}>Generate invite link</Text>}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, gap: spacing.sm },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroNote: { color: '#E7DEFF', fontSize: 12, fontWeight: '700' },
  card: { gap: spacing.md },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { borderColor: colors.primary, backgroundColor: '#F3EEFF' },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  createButton: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  successCard: { gap: spacing.md },
  successTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  successUrl: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  successActions: { flexDirection: 'row', gap: spacing.sm },
  copyButton: { flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: 'center' },
  copyButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  doneButton: { flex: 1, borderRadius: radius.md, backgroundColor: colors.primary, paddingVertical: spacing.md, alignItems: 'center' },
  doneButtonText: { color: 'white', fontSize: 13, fontWeight: '800' },
});
