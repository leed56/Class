import { User } from '@supabase/supabase-js';

export function getTeacherDisplayName(user: User | null) {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const email = user?.email;
  if (email) {
    return email.split('@')[0];
  }

  return 'Teacher';
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

export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTodayDate(date = new Date()) {
  return date.toLocaleDateString('en-LK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function formatLkrCompact(amount: number) {
  return formatLkr(amount);
}
