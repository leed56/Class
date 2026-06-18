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
import {
  archiveBranch,
  archiveHall,
  createBranch,
  createHall,
  listBranches,
  listHalls,
} from '@/features/locations/branchService';
import { Branch, Hall } from '@/features/locations/models';
import { ScheduleConflictBanner } from '@/features/locations/components/ScheduleConflictBanner';
import { listWorkspaceScheduleConflicts } from '@/features/locations/timetableService';
import { FormTextField } from '@/features/students/components/FormTextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function BranchesSettingsScreen() {
  return (
    <PermissionGate permission="manage_catalog">
      <BranchesSettingsContent />
    </PermissionGate>
  );
}

function BranchesSettingsContent() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [hallName, setHallName] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Awaited<ReturnType<typeof listWorkspaceScheduleConflicts>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [isSavingHall, setIsSavingHall] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextBranches, nextHalls, nextConflicts] = await Promise.all([
        listBranches(),
        listHalls(),
        listWorkspaceScheduleConflicts(),
      ]);
      setBranches(nextBranches);
      setHalls(nextHalls);
      setConflicts(nextConflicts);
      if (!selectedBranchId && nextBranches[0]) {
        setSelectedBranchId(nextBranches[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load branches.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreateBranch() {
    setIsSavingBranch(true);
    setError(null);
    try {
      const branch = await createBranch(branchName, branchAddress);
      setBranchName('');
      setBranchAddress('');
      setSelectedBranchId(branch.id);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not create branch.');
    } finally {
      setIsSavingBranch(false);
    }
  }

  async function handleCreateHall() {
    if (!selectedBranchId) return;
    setIsSavingHall(true);
    setError(null);
    try {
      await createHall(selectedBranchId, hallName);
      setHallName('');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not create hall.');
    } finally {
      setIsSavingHall(false);
    }
  }

  function confirmArchiveBranch(branch: Branch) {
    Alert.alert('Archive branch', `Hide ${branch.name} and its halls from scheduling?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          setWorkingId(branch.id);
          try {
            await archiveBranch(branch.id);
            await load();
          } catch (archiveError) {
            setError(archiveError instanceof Error ? archiveError.message : 'Could not archive branch.');
          } finally {
            setWorkingId(null);
          }
        },
      },
    ]);
  }

  function confirmArchiveHall(hall: Hall) {
    Alert.alert('Archive hall', `Hide ${hall.name} from class scheduling?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          setWorkingId(hall.id);
          try {
            await archiveHall(hall.id);
            await load();
          } catch (archiveError) {
            setError(archiveError instanceof Error ? archiveError.message : 'Could not archive hall.');
          } finally {
            setWorkingId(null);
          }
        },
      },
    ]);
  }

  const hallsForBranch = halls.filter((hall) => hall.branchId === selectedBranchId);

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
            <Text style={styles.title}>Branches & halls</Text>
            <Text style={styles.subtitle}>Manage institute locations and detect hall timetable conflicts.</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Multi-location ops</Text>
          <Text style={styles.heroTitle}>One dashboard, many branches</Text>
          <Text style={styles.heroNote}>Classes link to a hall so collection and attendance roll up by branch.</Text>
        </LinearGradient>

        {conflicts.length > 0 ? <ScheduleConflictBanner conflicts={conflicts} /> : null}

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Add branch</Text>
          <FormTextField label="Branch name" placeholder="Colombo 07" icon="source-branch" value={branchName} onChangeText={setBranchName} />
          <FormTextField label="Address (optional)" placeholder="123 Galle Road" icon="map-marker-outline" value={branchAddress} onChangeText={setBranchAddress} />
          <Pressable style={[styles.primaryButton, isSavingBranch && styles.primaryButtonDisabled]} onPress={handleCreateBranch} disabled={isSavingBranch || !branchName.trim()}>
            {isSavingBranch ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.primaryButtonText}>Add branch</Text>}
          </Pressable>
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Branches</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : branches.length === 0 ? (
            <Text style={styles.cardHint}>No branches yet.</Text>
          ) : (
            branches.map((branch, index) => (
              <View key={branch.id}>
                <Pressable style={[styles.branchRow, selectedBranchId === branch.id && styles.branchRowActive]} onPress={() => setSelectedBranchId(branch.id)}>
                  <View style={styles.branchCopy}>
                    <Text style={styles.branchName}>{branch.name}</Text>
                    {branch.address ? <Text style={styles.branchMeta}>{branch.address}</Text> : null}
                  </View>
                  {workingId === branch.id ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Pressable onPress={() => confirmArchiveBranch(branch)}>
                      <MaterialCommunityIcons name="archive-outline" size={18} color={colors.warning} />
                    </Pressable>
                  )}
                </Pressable>
                {index < branches.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          )}
        </PremiumCard>

        <PremiumCard style={styles.card}>
          <Text style={styles.cardTitle}>Halls in selected branch</Text>
          <FormTextField label="Hall name" placeholder="Hall A" icon="door-open" value={hallName} onChangeText={setHallName} />
          <Pressable
            style={[styles.primaryButton, isSavingHall && styles.primaryButtonDisabled]}
            onPress={handleCreateHall}
            disabled={isSavingHall || !hallName.trim() || !selectedBranchId}
          >
            {isSavingHall ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.primaryButtonText}>Add hall</Text>}
          </Pressable>
          {hallsForBranch.length === 0 ? (
            <Text style={styles.cardHint}>No halls in this branch yet.</Text>
          ) : (
            hallsForBranch.map((hall, index) => (
              <View key={hall.id}>
                <View style={styles.hallRow}>
                  <View>
                    <Text style={styles.hallName}>{hall.name}</Text>
                    {hall.capacity ? <Text style={styles.branchMeta}>Capacity {hall.capacity}</Text> : null}
                  </View>
                  {workingId === hall.id ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Pressable onPress={() => confirmArchiveHall(hall)}>
                      <MaterialCommunityIcons name="archive-outline" size={18} color={colors.warning} />
                    </Pressable>
                  )}
                </View>
                {index < hallsForBranch.length - 1 ? <View style={styles.divider} /> : null}
              </View>
            ))
          )}
        </PremiumCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
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
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  cardHint: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, backgroundColor: colors.primary },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '900' },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  branchRowActive: { backgroundColor: colors.primarySoft },
  branchCopy: { flex: 1 },
  branchName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  branchMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  hallRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
  hallName: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
