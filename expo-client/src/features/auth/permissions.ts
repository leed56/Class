import { WorkspaceRole } from '@/lib/database.types';

export type Permission =
  | 'manage_settings'
  | 'manage_staff'
  | 'manage_catalog'
  | 'issue_certificates'
  | 'revoke_certificates'
  | 'record_payments'
  | 'take_attendance'
  | 'manage_students'
  | 'archive_records'
  | 'view_reports'
  | 'manage_hall_rent';

const ROLE_PERMISSIONS: Record<WorkspaceRole, ReadonlySet<Permission>> = {
  owner: new Set([
    'manage_settings',
    'manage_staff',
    'manage_catalog',
    'issue_certificates',
    'revoke_certificates',
    'record_payments',
    'take_attendance',
    'manage_students',
    'archive_records',
    'view_reports',
    'manage_hall_rent',
  ]),
  admin: new Set([
    'manage_settings',
    'manage_catalog',
    'issue_certificates',
    'revoke_certificates',
    'record_payments',
    'take_attendance',
    'manage_students',
    'archive_records',
    'view_reports',
    'manage_hall_rent',
  ]),
  teacher: new Set([
    'issue_certificates',
    'record_payments',
    'take_attendance',
    'manage_students',
    'view_reports',
  ]),
  front_desk: new Set(['record_payments', 'manage_students', 'view_reports']),
};

export function can(role: WorkspaceRole | null | undefined, permission: Permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].has(permission);
}

const ROLE_I18N_KEYS: Record<WorkspaceRole, string> = {
  owner: 'staff.roleOwner',
  admin: 'staff.roleAdmin',
  teacher: 'staff.roleTeacher',
  front_desk: 'staff.roleFrontDesk',
};

export function roleLabel(role: WorkspaceRole, t: (path: string) => string) {
  return t(ROLE_I18N_KEYS[role]);
}

export function workspaceRoleLabels(t: (path: string) => string): Record<WorkspaceRole, string> {
  return {
    owner: t(ROLE_I18N_KEYS.owner),
    admin: t(ROLE_I18N_KEYS.admin),
    teacher: t(ROLE_I18N_KEYS.teacher),
    front_desk: t(ROLE_I18N_KEYS.front_desk),
  };
}

export const ASSIGNABLE_STAFF_ROLES: WorkspaceRole[] = ['admin', 'teacher', 'front_desk'];
