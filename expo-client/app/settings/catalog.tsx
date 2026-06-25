import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import { PermissionGate } from '@/features/auth/PermissionGate';
import {
  CatalogProgram,
  createBatch,
  createOffering,
  createProgram,
  listCatalogTree,
  OfferingType,
} from '@/features/catalog/catalogService';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { interpolate, resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

const extraOfferingTypes: OfferingType[] = ['revision', 'paper', 'extra', 'online'];

const offeringTypeKeys: Record<OfferingType, `catalog.offering${'Theory' | 'Revision' | 'Paper' | 'Extra' | 'Online'}`> = {
  theory: 'catalog.offeringTheory',
  revision: 'catalog.offeringRevision',
  paper: 'catalog.offeringPaper',
  extra: 'catalog.offeringExtra',
  online: 'catalog.offeringOnline',
};

function workspaceLabelKey(instituteType: string) {
  if (instituteType === 'academy') return 'catalog.workspaceAcademy' as const;
  if (instituteType === 'institute') return 'catalog.workspaceInstitute' as const;
  return 'catalog.workspaceSolo' as const;
}

export default function CatalogScreen() {
  return (
    <PermissionGate permission="manage_catalog">
      <CatalogContent />
    </PermissionGate>
  );
}

function CatalogContent() {
  const { t } = useI18n();
  const [programs, setPrograms] = useState<CatalogProgram[]>([]);
  const [instituteType, setInstituteType] = useState('solo');
  const [isLoading, setIsLoading] = useState(true);
  const [addingBatchId, setAddingBatchId] = useState<string | null>(null);
  const [newOfferingType, setNewOfferingType] = useState<OfferingType>('revision');
  const [newOfferingName, setNewOfferingName] = useState('');
  const [newOfferingFee, setNewOfferingFee] = useState('');
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramGrade, setNewProgramGrade] = useState('13');
  const [newProgramMedium, setNewProgramMedium] = useState('English');
  const [addingProgramId, setAddingProgramId] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tree, workspace] = await Promise.all([listCatalogTree(), getCurrentWorkspace()]);
      setPrograms(tree);
      setInstituteType(workspace?.institute_type ?? 'solo');
    } catch (loadError) {
      setError(resolveServiceErrorMessage(loadError, t, 'catalog.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog]),
  );

  function offeringLabel(type: OfferingType) {
    return t(offeringTypeKeys[type]);
  }

  function startAddOffering(batchId: string, programName: string) {
    setAddingBatchId(batchId);
    setNewOfferingType('revision');
    setNewOfferingName(`${programName} — ${offeringLabel('revision')}`);
    setNewOfferingFee('');
    setError(null);
  }

  async function handleCreateProgram() {
    if (!newProgramName.trim()) {
      Alert.alert(t('catalog.nameRequired'), t('catalog.programNameRequired'));
      return;
    }
    try {
      const program = await createProgram({
        name: newProgramName.trim(),
        grade: Number(newProgramGrade) || 13,
        medium: newProgramMedium as 'English' | 'Sinhala' | 'Tamil',
        syllabus: instituteType === 'academy' ? 'other' : 'local',
      });
      await createBatch({ programId: program.id, name: 'Main batch' });
      setShowProgramForm(false);
      setNewProgramName('');
      await loadCatalog();
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'catalog.addProgramFailed'));
    }
  }

  async function handleCreateBatch(programId: string) {
    if (!newBatchName.trim()) {
      Alert.alert(t('catalog.nameRequired'), t('catalog.batchNameRequired'));
      return;
    }
    try {
      await createBatch({ programId, name: newBatchName.trim() });
      setAddingProgramId(null);
      setNewBatchName('');
      await loadCatalog();
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'catalog.addBatchFailed'));
    }
  }

  async function handleCreateOffering() {
    if (!addingBatchId) return;
    try {
      await createOffering({
        batchId: addingBatchId,
        offeringType: newOfferingType,
        name: newOfferingName,
        defaultMonthlyFee: Number(newOfferingFee.replace(/\D/g, '') || 0),
      });
      setAddingBatchId(null);
      await loadCatalog();
    } catch (saveError) {
      setError(resolveServiceErrorMessage(saveError, t, 'catalog.addOfferingFailed'));
    }
  }

  function confirmAddOffering() {
    if (!newOfferingName.trim()) {
      Alert.alert(t('catalog.nameRequired'), t('catalog.subCourseNameRequired'));
      return;
    }
    Alert.alert(t('catalog.addSubCourseTitle'), newOfferingName.trim(), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('catalog.add'), onPress: () => void handleCreateOffering() },
    ]);
  }

  const offeringCount = programs.reduce(
    (sum, program) => sum + program.batches.reduce((batchSum, batch) => batchSum + batch.offerings.length, 0),
    0,
  );

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
            <Text style={styles.title}>{t('catalog.title')}</Text>
            <Text style={styles.subtitle}>{t('catalog.subtitle')}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="book-education-outline" size={30} color="white" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t(workspaceLabelKey(instituteType))}</Text>
            <Text style={styles.heroTitle}>
              {isLoading ? t('common.loading') : interpolate(t('catalog.programCount'), { count: programs.length })}
            </Text>
            <Text style={styles.heroNote}>{interpolate(t('catalog.heroNote'), { count: offeringCount })}</Text>
          </View>
        </LinearGradient>

        {error ? (
          <PremiumCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </PremiumCard>
        ) : null}

        {!isLoading ? (
          <PremiumCard style={styles.manageCard}>
            <Text style={styles.manageTitle}>{t('catalog.addToCatalog')}</Text>
            {showProgramForm ? (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>{t('catalog.newProgram')}</Text>
                <TextInput
                  value={newProgramName}
                  onChangeText={setNewProgramName}
                  placeholder={t('catalog.programPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                />
                <TextInput
                  value={newProgramGrade}
                  onChangeText={setNewProgramGrade}
                  placeholder={t('catalog.gradePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  style={styles.input}
                />
                <View style={styles.typeRow}>
                  {(['English', 'Sinhala', 'Tamil'] as const).map((medium) => (
                    <Pressable
                      key={medium}
                      style={[styles.typeChip, newProgramMedium === medium && styles.typeChipActive]}
                      onPress={() => setNewProgramMedium(medium)}
                    >
                      <Text style={[styles.typeChipText, newProgramMedium === medium && styles.typeChipTextActive]}>
                        {medium === 'English' ? t('settings.english') : medium === 'Sinhala' ? t('settings.sinhala') : t('settings.tamil')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.addActions}>
                  <Pressable style={styles.cancelButton} onPress={() => setShowProgramForm(false)}>
                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={() => void handleCreateProgram()}>
                    <Text style={styles.saveText}>{t('catalog.createProgram')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addButton} onPress={() => setShowProgramForm(true)}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addButtonText}>{t('catalog.addProgramBatch')}</Text>
              </Pressable>
            )}
          </PremiumCard>
        ) : null}

        {isLoading ? (
          <PremiumCard style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>{t('catalog.loading')}</Text>
          </PremiumCard>
        ) : programs.length === 0 ? (
          <PremiumCard>
            <EmptyState
              icon="google-classroom"
              title={t('catalog.emptyTitle')}
              message={
                instituteType === 'academy' ? t('catalog.emptyMessageAcademy') : t('catalog.emptyMessageDefault')
              }
              actionLabel={t('common.createClass')}
              actionHref="/classes/new"
            />
          </PremiumCard>
        ) : (
          <View style={styles.list}>
            {programs.map((program) => (
              <PremiumCard key={program.id} style={styles.programCard}>
                <View style={styles.programHeader}>
                  <View style={styles.programIcon}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.programCopy}>
                    <Text style={styles.programTitle}>{program.name}</Text>
                    <Text style={styles.programMeta}>
                      {interpolate(t('catalog.programMeta'), {
                        syllabus: program.syllabus,
                        grade: program.grade,
                        medium: program.medium,
                      })}
                    </Text>
                  </View>
                </View>

                {addingProgramId === program.id ? (
                  <View style={styles.addForm}>
                    <Text style={styles.addFormTitle}>{t('catalog.newBatch')}</Text>
                    <TextInput
                      value={newBatchName}
                      onChangeText={setNewBatchName}
                      placeholder={t('catalog.batchPlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                    />
                    <View style={styles.addActions}>
                      <Pressable style={styles.cancelButton} onPress={() => setAddingProgramId(null)}>
                        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                      </Pressable>
                      <Pressable style={styles.saveButton} onPress={() => void handleCreateBatch(program.id)}>
                        <Text style={styles.saveText}>{t('catalog.addBatch')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.addButton}
                    onPress={() => {
                      setAddingProgramId(program.id);
                      setNewBatchName(`${new Date().getFullYear()} Intake`);
                    }}
                  >
                    <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.primary} />
                    <Text style={styles.addButtonText}>{t('catalog.addBatch')}</Text>
                  </Pressable>
                )}

                {program.batches.map((batch) => (
                  <View key={batch.id} style={styles.batchBlock}>
                    <Text style={styles.batchTitle}>{batch.name}</Text>
                    {batch.exam_year ? (
                      <Text style={styles.batchMeta}>{interpolate(t('catalog.examYear'), { year: batch.exam_year })}</Text>
                    ) : null}

                    {batch.offerings.map((offering) => (
                      <View key={offering.id} style={styles.offeringRow}>
                        <View style={styles.offeringBadge}>
                          <Text style={styles.offeringBadgeText}>{offeringLabel(offering.offering_type)}</Text>
                        </View>
                        <View style={styles.offeringCopy}>
                          <Text style={styles.offeringName}>{offering.name}</Text>
                          <Text style={styles.offeringMeta}>
                            {formatLkr(offering.default_monthly_fee)}
                            {t('catalog.perMonth')}
                            {offering.linkedClassCount > 0
                              ? ` • ${interpolate(
                                  offering.linkedClassCount === 1 ? t('catalog.classSlot') : t('catalog.classSlots'),
                                  { count: offering.linkedClassCount },
                                )}`
                              : ` • ${t('catalog.noScheduleYet')}`}
                          </Text>
                        </View>
                      </View>
                    ))}

                    {addingBatchId === batch.id ? (
                      <View style={styles.addForm}>
                        <Text style={styles.addFormTitle}>{t('catalog.newSubCourse')}</Text>
                        <View style={styles.typeRow}>
                          {extraOfferingTypes.map((type) => (
                            <Pressable
                              key={type}
                              style={[styles.typeChip, newOfferingType === type && styles.typeChipActive]}
                              onPress={() => {
                                setNewOfferingType(type);
                                if (!newOfferingName || newOfferingName.includes('—')) {
                                  setNewOfferingName(`${program.name} — ${offeringLabel(type)}`);
                                }
                              }}
                            >
                              <Text style={[styles.typeChipText, newOfferingType === type && styles.typeChipTextActive]}>
                                {offeringLabel(type)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                        <TextInput
                          value={newOfferingName}
                          onChangeText={setNewOfferingName}
                          placeholder={t('catalog.offeringNamePlaceholder')}
                          placeholderTextColor={colors.textSecondary}
                          style={styles.input}
                        />
                        <TextInput
                          value={newOfferingFee}
                          onChangeText={setNewOfferingFee}
                          placeholder={t('catalog.monthlyFeePlaceholder')}
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="number-pad"
                          style={styles.input}
                        />
                        <View style={styles.addActions}>
                          <Pressable style={styles.cancelButton} onPress={() => setAddingBatchId(null)}>
                            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                          </Pressable>
                          <Pressable style={styles.saveButton} onPress={confirmAddOffering}>
                            <Text style={styles.saveText}>{t('catalog.addOffering')}</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable style={styles.addButton} onPress={() => startAddOffering(batch.id, program.name)}>
                        <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                        <Text style={styles.addButtonText}>{t('catalog.addRevisionPaperExtra')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </PremiumCard>
            ))}
          </View>
        )}

        <NavPressable href="/(tabs)/classes" style={styles.linkCard}>
          <PremiumCard style={styles.linkCardInner}>
            <MaterialCommunityIcons name="calendar-plus" size={22} color={colors.success} />
            <View style={styles.linkCopy}>
              <Text style={styles.linkTitle}>{t('catalog.scheduleClassSlot')}</Text>
              <Text style={styles.linkMeta}>{t('catalog.scheduleClassSlotMeta')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </PremiumCard>
        </NavPressable>
      </ScrollView>
    </SafeAreaView>
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.hero,
    padding: spacing.xxl,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroCopy: { flex: 1 },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  errorCard: { borderColor: colors.dangerSoft },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  stateCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  stateText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  manageCard: { gap: spacing.md },
  manageTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  list: { gap: spacing.md },
  programCard: { gap: spacing.md },
  programHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  programIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  programCopy: { flex: 1 },
  programTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  programMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  batchBlock: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  batchTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  batchMeta: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  offeringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  offeringBadge: {
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  offeringBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  offeringCopy: { flex: 1 },
  offeringName: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  offeringMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.background,
  },
  addButtonText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  addForm: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.background },
  addFormTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
  typeChipTextActive: { color: 'white' },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: colors.surface,
  },
  addActions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
  saveButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  saveText: { color: 'white', fontSize: 12, fontWeight: '900' },
  linkCard: {},
  linkCardInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.successSoft },
  linkCopy: { flex: 1 },
  linkTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  linkMeta: { marginTop: 3, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
});
