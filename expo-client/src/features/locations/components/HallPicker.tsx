import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { ChoiceChipGroup } from '@/features/students/components/ChoiceChipGroup';
import { ensureDefaultLocationSetup, listHallOptions } from '@/features/locations/branchService';
import { HallOption } from '@/features/locations/models';
import { resolveServiceErrorMessage } from '@/i18n';
import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  selectedHallId: string | null;
  onSelect: (hallId: string | null, label: string) => void;
};

export function HallPicker({ selectedHallId, onSelect }: Props) {
  const { t } = useI18n();
  const [options, setOptions] = useState<HallOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        await ensureDefaultLocationSetup();
        const nextOptions = await listHallOptions();
        if (!active) return;
        setOptions(nextOptions);
      } catch (loadError) {
        if (!active) return;
        setError(resolveServiceErrorMessage(loadError, t, 'branches.loadHallsFailed'));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [t]);

  if (isLoading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>{t('branches.loadingHalls')}</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (options.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{t('branches.emptyHallsPicker')}</Text>
        <Link href="/settings/branches" asChild>
          <Pressable>
            <Text style={styles.linkText}>{t('branches.openBranchesLink')}</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const selectedLabel = options.find((option) => option.id === selectedHallId)?.label ?? options[0].label;

  return (
    <ChoiceChipGroup
      label={t('branches.hallLabel')}
      selected={selectedLabel}
      options={options.map((option) => option.label)}
      onSelect={(label) => {
        const match = options.find((option) => option.label === label);
        onSelect(match?.id ?? null, label);
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  emptyBox: { gap: spacing.xs },
  emptyText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  linkText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
});
