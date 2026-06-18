import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthProvider';
import { useWorkspaceShell } from '@/core/layout/WorkspaceShellContext';
import { getTeacherInitials } from '@/features/auth/teacherProfile';
import { InstituteType } from '@/lib/database.types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type NavItem = {
  label: string;
  href: Href;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  match: string;
  instituteOnly?: boolean;
};

const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/(tabs)', icon: 'view-dashboard-outline', match: '/index' },
  { label: 'Classes', href: '/(tabs)/classes', icon: 'google-classroom', match: '/classes' },
  { label: 'Students', href: '/(tabs)/students', icon: 'account-group-outline', match: '/students' },
  { label: 'Fees', href: '/(tabs)/fees', icon: 'cash-multiple', match: '/fees' },
];

const operationsNav: NavItem[] = [
  { label: 'Halls & branches', href: '/settings/branches', icon: 'office-building-outline', match: '/settings/branches', instituteOnly: true },
  { label: 'Hall rent', href: '/settings/hall-rent', icon: 'cash-clock', match: '/settings/hall-rent', instituteOnly: true },
  { label: 'Reports', href: '/reports', icon: 'chart-box-outline', match: '/reports' },
  { label: 'Settings', href: '/settings', icon: 'cog-outline', match: '/settings' },
];

function workspaceLabel(type: InstituteType) {
  if (type === 'institute') return 'Tuition building';
  if (type === 'academy') return 'Academy';
  return 'Solo tutor';
}

function isActive(pathname: string, match: string, href: string) {
  if (match === '/index') {
    return pathname === '/' || pathname.endsWith('/index') || pathname === '/(tabs)';
  }
  return pathname.includes(match) || pathname === href;
}

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { instituteType, workspaceName } = useWorkspaceShell();

  const opsItems = operationsNav.filter((item) => !item.instituteOnly || instituteType === 'institute');

  return (
    <View style={styles.sidebar}>
      <View style={styles.brandBlock}>
        <View style={styles.brandIcon}>
          <MaterialCommunityIcons name="school-outline" size={22} color="white" />
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandTitle}>ClassFlow</Text>
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            {workspaceName ?? 'Workspace'}
          </Text>
          <Text style={styles.brandType}>{workspaceLabel(instituteType)}</Text>
        </View>
      </View>

      <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Main</Text>
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.match, item.href as string);
          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}

        <Text style={styles.sectionLabel}>Operations</Text>
        {opsItems.map((item) => {
          const active = isActive(pathname, item.match, item.href as string);
          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.href)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{getTeacherInitials(user)}</Text>
          </View>
          <View style={styles.userCopy}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.email?.split('@')[0] ?? 'Teacher'}
            </Text>
            <Text style={styles.userRole}>{workspaceLabel(instituteType)}</Text>
          </View>
        </View>
        <Pressable style={styles.signOutButton} onPress={() => signOut()}>
          <MaterialCommunityIcons name="logout" size={16} color={colors.textSecondary} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandCopy: { flex: 1 },
  brandTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  brandSubtitle: { marginTop: 2, color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  brandType: { marginTop: 2, color: colors.primary, fontSize: 10, fontWeight: '800' },
  navScroll: { flex: 1 },
  navContent: { paddingHorizontal: spacing.md, gap: 4, paddingBottom: spacing.lg },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.lg,
  },
  navItemActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
  },
  navLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  navLabelActive: { color: colors.primary },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  userCopy: { flex: 1 },
  userName: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
  userRole: { marginTop: 2, color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  signOutText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
});
