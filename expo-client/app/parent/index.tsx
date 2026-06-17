import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NavPressable } from '@/components/NavPressable';
import { PremiumCard } from '@/components/PremiumCard';
import {
  clearParentSession,
  formatParentPhone,
  getParentSession,
  ParentChild,
  ParentSession,
} from '@/features/parent/parentAuthService';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ParentHomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<ParentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextSession = await getParentSession();
      setSession(nextSession);
      if (!nextSession) {
        router.replace('/parent/login');
        return;
      }
      if (nextSession.children.length === 1) {
        router.replace(`/parent/child/${nextSession.children[0].id}` as Href);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSignOut() {
    await clearParentSession();
    router.replace('/parent/login');
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Your children</Text>
            <Text style={styles.subtitle}>{formatParentPhone(session.phone)}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          </Pressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <Text style={styles.heroLabel}>Parent portal</Text>
          <Text style={styles.heroTitle}>Choose a child</Text>
          <Text style={styles.heroNote}>View attendance, fee status, receipts and certificates.</Text>
        </LinearGradient>

        <View style={styles.list}>
          {session.children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChildCard({ child }: { child: ParentChild }) {
  return (
    <NavPressable href={`/parent/child/${child.id}` as Href}>
      <PremiumCard style={styles.childCard}>
        <View style={styles.childIcon}>
          <MaterialCommunityIcons name="account-school-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.childCopy}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childMeta}>
            Grade {child.grade} • {child.medium} • {child.workspaceName}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={21} color={colors.textSecondary} />
      </PremiumCard>
    </NavPressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 32, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  iconButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  hero: { borderRadius: radius.hero, padding: spacing.xxl, overflow: 'hidden' },
  heroLabel: { color: '#E7DEFF', fontSize: 12, fontWeight: '800' },
  heroTitle: { marginTop: 4, color: 'white', fontSize: 24, fontWeight: '900' },
  heroNote: { marginTop: 6, color: '#E7DEFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  list: { gap: spacing.md },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  childIcon: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  childCopy: { flex: 1 },
  childName: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  childMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' },
});
