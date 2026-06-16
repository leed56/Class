import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentWorkspace } from '@/features/auth/authService';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function IndexScreen() {
  useEffect(() => {
    let isMounted = true;

    async function routeBySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const workspace = await getCurrentWorkspace();
      if (!isMounted) return;

      router.replace(workspace ? '/(tabs)' : '/onboarding');
    }

    routeBySession().catch(() => {
      if (isMounted) router.replace('/auth/login');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <MaterialCommunityIcons name="school" size={30} color="white" />
        </View>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.title}>Loading ClassFlow</Text>
        <Text style={styles.subtitle}>Checking your secure teacher workspace...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
