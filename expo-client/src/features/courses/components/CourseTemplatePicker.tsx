import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  MARITIME_TRACKS,
  MaritimeTrack,
} from '@/features/courses/maritimeCourseModel';
import {
  ACADEMY_SECTORS,
  AcademySector,
  getSectorInfo,
  getTemplatesForSector,
  SlCourseTemplate,
  SCHOOL_EXAM_LEVEL_OPTIONS,
  ExamLevel,
} from '@/features/courses/slCourseModel';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  sector: AcademySector;
  onSectorChange: (sector: AcademySector) => void;
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
  selectedTemplateId,
  examLevel,
  onExamLevelChange,
  onSelectTemplate,
}: Props) {
  const [maritimeTrack, setMaritimeTrack] = useState<MaritimeTrack>('officer_cadet');
  const sectorInfo = getSectorInfo(sector);

  useEffect(() => {
    if (sector === 'maritime') setMaritimeTrack('officer_cadet');
  }, [sector]);

  const templates =
    sector === 'school_tuition'
      ? getTemplatesForSector(sector).filter((item) => item.examLevel === examLevel)
      : sector === 'maritime'
        ? getTemplatesForSector(sector).filter((item) => 'maritimeTrack' in item && item.maritimeTrack === maritimeTrack)
        : getTemplatesForSector(sector);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Academy sector</Text>
      <Text style={styles.hint}>
        Sri Lankan institutes run many verticals — pick what your academy actually teaches.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectorRow}>
        {ACADEMY_SECTORS.map((item) => {
          const active = sector === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.sectorChip, active && styles.sectorChipActive]}
              onPress={() => onSectorChange(item.id)}
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

      {sectorInfo ? (
        <View style={styles.sectorNote}>
          <Text style={styles.sectorNoteTitle}>{sectorInfo.label}</Text>
          <Text style={styles.sectorNoteCopy}>{sectorInfo.subtitle}</Text>
          <Text style={styles.sectorExamples}>e.g. {sectorInfo.examples}</Text>
        </View>
      ) : null}

      {sector === 'school_tuition' ? (
        <>
          <Text style={styles.label}>Exam level</Text>
          <View style={styles.levelRow}>
            {SCHOOL_EXAM_LEVEL_OPTIONS.map((level) => {
              const active = examLevel === level;
              return (
                <Pressable
                  key={level}
                  style={[styles.levelChip, active && styles.levelChipActive]}
                  onPress={() => onExamLevelChange(level)}
                >
                  <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>{level}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {sector === 'maritime' ? (
        <>
          <Text style={styles.label}>Maritime programme track</Text>
          <Text style={styles.hint}>
            Based on MSTI, CINEC & SMTI — officer cadet, ratings, STCW, simulators & CoP prep.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
            {MARITIME_TRACKS.map((track) => {
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

      <Text style={styles.label}>Course programme</Text>
      <View style={styles.templateList}>
        {templates.length === 0 ? (
          <Text style={styles.emptyText}>No presets for this filter. Type a custom programme name below.</Text>
        ) : (
          templates.map((template) => {
            const active = selectedTemplateId === template.id;
            const maritimeMeta =
              'phaseLabel' in template && template.phaseLabel
                ? ` • ${template.phaseLabel}`
                : 'durationNote' in template && template.durationNote
                  ? ` • ${template.durationNote}`
                  : '';
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
                  <Text style={[styles.templateTitle, active && styles.templateTitleActive]}>{template.label}</Text>
                  <Text style={styles.templateMeta}>
                    {template.medium} • from {formatLkr(template.suggestedFee)}
                    {template.intakeLabel ? ` • ${template.intakeLabel}` : ''}
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
