import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

export function QrScannerPanel({ onScan, onError }: Props) {
  const [status, setStatus] = useState('Starting camera…');
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const lastScanRef = useRef('');
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('classflow-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (cancelled) return;
            if (decodedText === lastScanRef.current) return;
            lastScanRef.current = decodedText;
            onScanRef.current(decodedText);
            setTimeout(() => {
              lastScanRef.current = '';
            }, 1200);
          },
          () => undefined,
        );

        if (!cancelled) {
          setStatus('Point camera at student QR card');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not start camera.';
        setStatus('Camera unavailable on this device.');
        onErrorRef.current?.(message);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      {createElement('div', {
        id: 'classflow-qr-reader',
        style: {
          width: '100%',
          minHeight: 280,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
        },
      })}
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  status: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
