import { User } from '@supabase/supabase-js';

/** English fallback when profile name is unknown — compare with this, not localized labels. */
export const TEACHER_DISPLAY_FALLBACK = 'Teacher';

export function getTeacherDisplayName(user: User | null) {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const email = user?.email;
  if (email) {
    return email.split('@')[0];
  }

  return TEACHER_DISPLAY_FALLBACK;
}

export function getTeacherInitials(user: User | null) {
  const name = getTeacherDisplayName(user);
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function formatLkrCompact(amount: number) {
  return formatLkr(amount);
}
