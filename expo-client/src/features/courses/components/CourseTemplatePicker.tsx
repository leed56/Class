import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  MaritimeTrack,
} from '@/features/courses/maritimeCourseModel';
import {
  AcademySector,
  ExamLevel,
  getTemplatesForSector,
  SlCourseTemplate,
} from '@/features/courses/slCourseModel';
import {
  listLocalizedExamLevels,
  listLocalizedMaritimeTracks,
} from '@/i18n/coursePickerLabels';
import {
  getLocalizedCourseTemplateDurationNote,
  getLocalizedCourseTemplateLabel,
  getLocalizedCourseTemplatePhaseLabel,
  getLocalizedIntakeLabel,
} from '@/i18n/courseTemplateLabels';
import {
  getLocalizedSectorInfo,
  interpolate,
  listLocalizedSectors,
} from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { Medium } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  sector: AcademySector;
  onSectorChange: (sector: AcademySector) => void;
  /** When true, sector is fixed to the workspace — only that vertical's templates are shown. */
  lockSector?: boolean;
  selectedTemplateId: string | null;
  examLevel: ExamLevel;
  onExamLevelChange: (level: ExamLevel) => void;
  onSelectTemplate: (template: SlCourseTemplate) => void;
};

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function CourseTemplatePicker({
  sector,
  onSectorChange,
  lockSector = false,
  selectedTemplateId,
  examLevel,
  onExamLevelChange,
  onSelectTemplate,
}: Props) {
  const { t } = useI18n();
  const [maritimeTrack, setMaritimeTrack] = useState<MaritimeTrack>('officer_cadet');
  const sectorInfo = getLocalizedSectorInfo(sector, t);
  const localizedSectors = listLocalizedSectors(t);
  const localizedExamLevels = listLocalizedExamLevels(t);
  const localizedMaritimeTracks = listLocalizedMaritimeTracks(t);
  const mediumLabels: Record<Medium, string> = {
    English: t('settings.english'),
    Sinhala: t('settings.sinhala'),
    Tamil: t('settings.tamil'),
  };

  function handleSectorChange(nextSector: AcademySector) {
    if (nextSector === 'maritime') setMaritimeTrack('officer_cadet');
    onSectorChange(nextSector);
  }

  const templates =
    sector === 'school_tuition'
      ? getTemplatesForSector(sector).filter((item) => item.examLevel === examLevel)
      : sector === 'maritime'
        ? getTemplatesForSector(sector).filter((item) => 'maritimeTrack' in item && item.maritimeTrack === maritimeTrack)
        : getTemplatesForSector(sector);

  return (
    <View style={styles.wrap}>
      {lockSector ? (
        <>
          <Text style={styles.label}>{t('classForm.sectorLockedLabel')}</Text>
          <Text style={styles.hint}>{t('classForm.sectorLockedHint')}</Text>
          {sectorInfo ? (
            <View style={[styles.sectorNote, styles.sectorNoteLocked]}>
              <View style={styles.sectorLockedRow}>
                <MaterialCommunityIcons
                  name={sectorInfo.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.sectorNoteTitle}>{sectorInfo.label}</Text>
                <MaterialCommunityIcons name="lock-outline" size={14} color={colors.textMuted} />
              </View>
              <Text style={styles.sectorNoteCopy}>{sectorInfo.subtitle}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.label}>{t('classForm.sectorLabel')}</Text>
          <Text style={styles.hint}>{t('classForm.sectorHint')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectorRow}>
            {localizedSectors.map((item) => {
              const active = sector === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.sectorChip, active && styles.sectorChipActive]}
                  onPress={() => handleSectorChange(item.id)}
                >
                  <MaterialCommunityIcons
                    name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={14}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.sectorChipText, active && styles.sectorChipTextActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {!lockSector && sectorInfo ? (
        <View style={styles.sectorNote}>
          <Text style={styles.sectorNoteTitle}>{sectorInfo.label}</Text>
          <Text style={styles.sectorNoteCopy}>{sectorInfo.subtitle}</Text>
          <Text style={styles.sectorExamples}>{interpolate(t('classForm.sectorExamples'), { examples: sectorInfo.examples })}</Text>
        </View>
      ) : null}

      {sector === 'school_tuition' ? (
        <>
          <Text style={styles.label}>{t('classForm.examLevelLabel')}</Text>
          <View style={styles.levelRow}>
            {localizedExamLevels.map(({ value: level, label }) => {
              const active = examLevel === level;
              return (
                <Pressable
                  key={level}
                  style={[styles.levelChip, active && styles.levelChipActive]}
                  onPress={() => onExamLevelChange(level)}
                >
                  <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {sector === 'maritime' ? (
        <>
          <Text style={styles.label}>{t('classForm.maritimeTrackLabel')}</Text>
          <Text style={styles.hint}>{t('classForm.maritimeTrackHint')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
            {localizedMaritimeTracks.map((track) => {
              const active = maritimeTrack === track.id;
              return (
                <Pressable
                  key={track.id}
                  style={[styles.trackChip, active && styles.trackChipActive]}
                  onPress={() => setMaritimeTrack(track.id)}
                >
                  <Text style={[styles.trackChipTitle, active && styles.trackChipTitleActive]}>{track.label}</Text>
                  <Text style={styles.trackChipSub} numberOfLines={2}>
                    {track.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <Text style={styles.label}>{t('classForm.courseProgrammeLabel')}</Text>
      <View style={styles.templateList}>
        {templates.length === 0 ? (
          <Text style={styles.emptyText}>{t('classForm.noPresets')}</Text>
        ) : (
          templates.map((template) => {
            const active = selectedTemplateId === template.id;
            const phaseLabel = getLocalizedCourseTemplatePhaseLabel(
              template.id,
              'phaseLabel' in template && typeof template.phaseLabel === 'string'
                ? template.phaseLabel
                : undefined,
              t,
            );
            const durationNote = getLocalizedCourseTemplateDurationNote(
              template.id,
              'durationNote' in template && typeof template.durationNote === 'string'
                ? template.durationNote
                : undefined,
              t,
            );
            const maritimeMeta = phaseLabel
              ? ` • ${phaseLabel}`
              : durationNote
                ? ` • ${durationNote}`
                : '';
            const intakeLabel = getLocalizedIntakeLabel(template.intakeLabel, t);
            const templateLabel = getLocalizedCourseTemplateLabel(template.id, template.label, t);
            const mediumLabel = mediumLabels[template.medium as Medium] ?? template.medium;

            return (
              <Pressable
                key={template.id}
                style={[styles.templateCard, active && styles.templateCardActive]}
                onPress={() => onSelectTemplate(template)}
              >
                <View style={styles.templateIcon}>
                  <MaterialCommunityIcons
                    name={sector === 'maritime' ? 'ferry' : 'book-education-outline'}
                    size={18}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.templateCopy}>
                  <Text style={[styles.templateTitle, active && styles.templateTitleActive]}>{templateLabel}</Text>
                  <Text style={styles.templateMeta}>
                    {interpolate(t('classForm.templateMeta'), {
                      medium: mediumLabel,
                      fee: formatLkr(template.suggestedFee),
                    })}
                    {intakeLabel ? ` • ${intakeLabel}` : ''}
                    {maritimeMeta}
                  </Text>
                </View>
                {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  hint: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  sectorRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  sectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    maxWidth: 160,
  },
  sectorChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  sectorChipText: { color: colors.textSecondary, fontSize: 10, fontWeight: '800' },
  sectorChipTextActive: { color: colors.primary },
  sectorNote: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: 2,
  },
  sectorNoteLocked: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  sectorLockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectorNoteTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  sectorNoteCopy: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  sectorExamples: { color: colors.textMuted, fontSize: 10, fontWeight: '700', fontStyle: 'italic' },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  levelChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  levelChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  levelChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  levelChipTextActive: { color: colors.primary },
  trackRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  trackChip: {
    width: 148,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  trackChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  trackChipTitle: { color: colors.textPrimary, fontSize: 11, fontWeight: '900' },
  trackChipTitleActive: { color: colors.primary },
  trackChipSub: { marginTop: 2, color: colors.textMuted, fontSize: 9, fontWeight: '700', lineHeight: 13 },
  templateList: { gap: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  templateCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCopy: { flex: 1 },
  templateTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  templateTitleActive: { color: colors.primary },
  templateMeta: { marginTop: 2, color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
});
