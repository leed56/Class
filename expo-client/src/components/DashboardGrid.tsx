import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';

export function DashboardMetricGrid({ children, desktop = false }: { children: ReactNode; desktop?: boolean }) {
  return (
    <View style={[styles.metricGrid, desktop && styles.metricGridDesktop]}>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={[styles.metricCell, desktop && styles.metricCellDesktop]}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function DashboardRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function DashboardCol({ children, flex = 1 }: { children: ReactNode; flex?: number }) {
  return (
    <View style={[styles.col, flex === 3 && styles.colWide, flex === 2 && styles.colNarrow]}>
      {children}
    </View>
  );
}

export function DashboardSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: '100%',
  },
  metricGridDesktop: {
    flexWrap: 'nowrap',
    gap: spacing.md,
    width: '100%',
    maxWidth: '100%',
  },
  metricCell: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
  },
  metricCellDesktop: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: '25%',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: spacing.xl,
    width: '100%',
    maxWidth: '100%',
  },
  col: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '100%',
    minWidth: 0,
    gap: spacing.lg,
    alignSelf: 'stretch',
  },
  colWide: {
    flexBasis: '58%',
    minWidth: 320,
  },
  colNarrow: {
    flexBasis: '38%',
    minWidth: 280,
  },
  section: {
    width: '100%',
    maxWidth: '100%',
    gap: spacing.xxl,
  },
});
