import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/i18n/I18nProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

export function QrScannerPanel(_props: Props) {
  const { t } = useI18n();

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="qrcode-scan" size={42} color={colors.primary} />
      </View>
      <Text style={styles.title}>{t('classScan.webScannerTitle')}</Text>
      <Text style={styles.copy}>{t('classScan.webScannerCopy')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  copy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
