import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { ASSIGNABLE_STAFF_ROLES, roleLabel } from '@/features/auth/permissions';
import {
  addStaffMemberByEmail,
  listWorkspaceStaff,
  removeStaffMember,
  updateStaffMemberRole,
  WorkspaceStaffMember,
} from '@/features/auth/staffService';
import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { FormTextField } from '@/features/students/components/FormTextField';
import { WorkspaceRole } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const roleOptions = ASSIGNABLE_STAFF_ROLES.map((role) => roleLabel(role));

function roleFromLabel(label: string): WorkspaceRole {
  if (label === 'Admin') return 'admin';
  if (label === 'Front desk') return 'front_desk';
  return 'teacher';
}

function StaffSettingsContent() {
  const [staff, setStaff] = useState<WorkspaceStaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('Teacher');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listWorkspaceStaff();
      setStaff(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load staff.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStaff();
    }, [loadStaff]),
  );

  async function handleAddStaff() {
    setError(null);
    setIsAdding(true);
    try {
      await addStaffMemberByEmail(email, roleFromLabel(newRoleLabel));
      setEmail('');
      await loadStaff();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add staff member.');
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
      setError(changeError instanceof Error ? changeError.message : 'Could not update role.');
    } finally {
      setWorkingUserId(null);
    }
  }

  function confirmRemove(member: WorkspaceStaffMember) {
    if (member.role === 'owner') return;
    Alert.alert(
      'Remove staff member',
      `Remove ${member.fullName || member.email} from this workspace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setWorkingUserId(member.userId);
            setError(null);
            try {
              await removeStaffMember(member.userId);
              await loadStaff();
            } catch (removeError) {
              setError(removeError instanceof Error ? removeError.message : 'Could not remove staff.');
            } finally {
              setWorkingUserId(null);
            }
          },
        },
      ],
    );
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
            <Text style={styles.title}>Staff & roles</Text>
            <Text style={styles.subtitle}>Assign admin, teacher and front-desk access for institute operations.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Institute operations</Text>
          <Text style={styles.heroTitle}>Safe daily workflows</Text>
          <Text style={styles.heroNote}>
            Front desk can record payments. Teachers take attendance and issue certificates. Only owners manage staff.
          </Text>
        </LinearGradient>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Add staff member</Text>
          <Text style={styles.cardHint}>They must already have a ClassFlow account with this email.</Text>
          <FormTextField
            label="Staff email"
            placeholder="teacher@example.com"
            icon="email-outline"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <ChoiceChipGroup
            label="Role"
            selected={newRoleLabel}
            options={roleOptions}
            onSelect={setNewRoleLabel}
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
                <Text style={styles.primaryButtonText}>Add to workspace</Text>
              </>
            )}
          </Pressable>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Current staff</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : staff.length === 0 ? (
            <Text style={styles.cardHint}>No staff members yet.</Text>
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
                      <Text style={styles.ownerBadgeText}>Owner</Text>
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
                    label="Assigned role"
                    selected={roleLabel(member.role)}
                    options={roleOptions}
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

export default function StaffSettingsScreen() {
  return (
    <PermissionGate permission="manage_staff" message="Only the workspace owner can manage staff.">
      <StaffSettingsContent />
    </PermissionGate>
  );
}

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
