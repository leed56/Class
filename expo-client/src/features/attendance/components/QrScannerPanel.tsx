import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type Props = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

export function QrScannerPanel(_props: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="qrcode-scan" size={42} color={colors.primary} />
      </View>
      <Text style={styles.title}>Scanner available on web</Text>
      <Text style={styles.copy}>
        Open ClassFlow in your mobile browser or desktop with a camera to use QR check-in. You can still mark attendance manually on this device.
      </Text>
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
