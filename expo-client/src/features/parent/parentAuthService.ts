import AsyncStorage from '@react-native-async-storage/async-storage';

import { flushQueuedParentOtpSms } from '@/features/notifications/smsOutboxService';
import { throwServiceError } from '@/i18n/serviceErrors';
import { getSupabase } from '@/lib/supabase';

const PARENT_SESSION_KEY = 'classflow:parent_session';

export type ParentChild = {
  id: string;
  name: string;
  grade: number;
  medium: string;
  workspaceId: string;
  workspaceName: string;
};

export type ParentSession = {
  token: string;
  phone: string;
  expiresAt: string;
  children: ParentChild[];
};

type RequestOtpResult = {
  phone: string;
  childCount: number;
  expiresAt: string;
  code: string | null;
  smsQueued?: boolean;
};

type VerifyOtpResult = {
  sessionToken: string;
  phone: string;
  expiresAt: string;
  children: ParentChild[];
};

function mapChildren(value: unknown): ParentChild[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== 'string' || typeof row.name !== 'string') return null;
      return {
        id: row.id,
        name: row.name,
        grade: Number(row.grade ?? 0),
        medium: String(row.medium ?? ''),
        workspaceId: String(row.workspaceId ?? ''),
        workspaceName: String(row.workspaceName ?? 'Institute'),
      } satisfies ParentChild;
    })
    .filter((item): item is ParentChild => item !== null);
}

export async function getParentSession(): Promise<ParentSession | null> {
  const raw = await AsyncStorage.getItem(PARENT_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ParentSession;
    if (!parsed?.token || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      await clearParentSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveParentSession(session: ParentSession) {
  await AsyncStorage.setItem(PARENT_SESSION_KEY, JSON.stringify(session));
}

export async function clearParentSession() {
  await AsyncStorage.removeItem(PARENT_SESSION_KEY);
}

export async function requestParentOtp(phone: string) {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('request_parent_otp', { raw_phone: phone.trim() });
  if (error) throw new Error(error.message);

  const result = data as RequestOtpResult;

  if (result.smsQueued) {
    void flushQueuedParentOtpSms(result.phone);
  }

  return {
    phone: result.phone,
    childCount: result.childCount,
    expiresAt: result.expiresAt,
    code: result.code,
    smsQueued: Boolean(result.smsQueued),
  };
}

export async function verifyParentOtp(phone: string, code: string) {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('verify_parent_otp', {
    raw_phone: phone.trim(),
    raw_code: code.trim(),
  });
  if (error) throw new Error(error.message);

  const result = data as VerifyOtpResult;
  const session: ParentSession = {
    token: result.sessionToken,
    phone: result.phone,
    expiresAt: result.expiresAt,
    children: mapChildren(result.children),
  };
  await saveParentSession(session);
  return session;
}

export function formatParentPhone(phone: string) {
  if (phone.startsWith('94') && phone.length === 11) {
    return `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
}
