import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import { ASSIGNABLE_STAFF_ROLES, workspaceRoleLabels } from '@/features/auth/permissions';
import {
  addStaffMemberByEmail,
  listWorkspaceStaff,
  removeStaffMember,
  updateStaffMemberRole,
  WorkspaceStaffMember,
} from '@/features/auth/staffService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { interpolate } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { WorkspaceRole } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function StaffSettingsContent() {
  const { t } = useI18n();
  const [staff, setStaff] = useState<WorkspaceStaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<WorkspaceRole>('teacher');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);

  const roleLabels = useMemo(() => workspaceRoleLabels(t), [t]);

  const assignableRoleOptions = useMemo(
    () => ASSIGNABLE_STAFF_ROLES.map((role) => roleLabels[role]),
    [roleLabels],
  );

  const roleFromLabel = useCallback(
    (label: string): WorkspaceRole => {
      const match = (Object.entries(roleLabels) as [WorkspaceRole, string][]).find(([, value]) => value === label);
      return match?.[0] ?? 'teacher';
    },
    [roleLabels],
  );

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listWorkspaceStaff();
      setStaff(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('staff.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [loadStaff]),
  );

  async function handleAddStaff() {
    setError(null);
    setIsAdding(true);
    try {
      await addStaffMemberByEmail(email, newRole);
      setEmail('');
      await loadStaff();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : t('staff.addFailed'));
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRoleChange(member: WorkspaceStaffMember, label: string) {
    if (member.role === 'owner') return;
    setWorkingUserId(member.userId);
    setError(null);
    try {
      await updateStaffMemberRole(member.userId, roleFromLabel(label));
      await loadStaff();
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : t('staff.updateFailed'));
    } finally {
      setWorkingUserId(null);
    }
  }

  function confirmRemove(member: WorkspaceStaffMember) {
    if (member.role === 'owner') return;
    const name = member.fullName || member.email;
    Alert.alert(t('staff.removeTitle'), interpolate(t('staff.removeMessage'), { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('staff.remove'),
        style: 'destructive',
        onPress: async () => {
          setWorkingUserId(member.userId);
          setError(null);
          try {
            await removeStaffMember(member.userId);
            await loadStaff();
          } catch (removeError) {
            setError(removeError instanceof Error ? removeError.message : t('staff.removeFailed'));
          } finally {
            setWorkingUserId(null);
          }
        },
      },
    ]);
  }

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
            <Text style={styles.title}>{t('staff.title')}</Text>
            <Text style={styles.subtitle}>{t('staff.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>{t('staff.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{t('staff.heroTitle')}</Text>
          <Text style={styles.heroNote}>{t('staff.heroNote')}</Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('staff.addTitle')}</Text>
          <Text style={styles.cardHint}>{t('staff.addHint')}</Text>
          <FormTextField
            label={t('staff.emailLabel')}
            placeholder={t('staff.emailPlaceholder')}
            icon="email-outline"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <ChoiceChipGroup
            label={t('staff.roleLabel')}
            selected={roleLabels[newRole]}
            options={assignableRoleOptions}
            onSelect={(label) => setNewRole(roleFromLabel(label))}
          />
          <Pressable
            style={[styles.primaryButton, isAdding && styles.primaryButtonDisabled]}
            onPress={handleAddStaff}
            disabled={isAdding || !email.trim()}
          >
            {isAdding ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus-outline" size={18} color="white" />
                <Text style={styles.primaryButtonText}>{t('staff.addToWorkspace')}</Text>
              </>
            )}
          </Pressable>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('staff.currentStaff')}</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : staff.length === 0 ? (
            <Text style={styles.cardHint}>{t('staff.emptyStaff')}</Text>
          ) : (
            staff.map((member, index) => (
              <View key={member.userId}>
                <View style={styles.memberRow}>
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>{member.fullName || member.email}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  {member.role === 'owner' ? (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>{roleLabels.owner}</Text>
                    </View>
                  ) : workingUserId === member.userId ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Pressable style={styles.removeButton} onPress={() => confirmRemove(member)}>
                      <MaterialCommunityIcons name="account-remove-outline" size={18} color={colors.danger} />
                    </Pressable>
                  )}
                </View>
                {member.role !== 'owner' ? (
                  <ChoiceChipGroup
                    label={t('staff.assignedRoleLabel')}
                    selected={roleLabels[member.role]}
                    options={assignableRoleOptions}
                    onSelect={(label) => handleRoleChange(member, label)}
                  />
                ) : null}
                {index < staff.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          )}
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StaffSettingsScreen() {
  const { t } = useI18n();

  return (
    <PermissionGate permission="manage_staff" message={t('staff.ownerOnly')}>
      <StaffSettingsContent />
    </PermissionGate>
  );
}

export default StaffSettingsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberCopy: { flex: 1 },
  memberName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  memberEmail: { marginTop: 2, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  ownerBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primarySoft,
  },
  ownerBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
