import { Session, User } from '@supabase/supabase-js';
import { Href, useRouter, useSegments } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const demoMode = !isSupabaseConfigured;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!demoMode);

  useEffect(() => {
    if (demoMode) {
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [demoMode]);

  useEffect(() => {
    if (loading || demoMode) {
      return;
    }

    const segment = segments[0] as string | undefined;
    const inAuthGroup = segment === 'auth';
    const inOnboarding = segment === 'onboarding';
    const inParentPortal = segment === 'parent';

    if (!session && !inAuthGroup && !inParentPortal) {
      router.replace('/auth/login' as Href);
      return;
    }

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }

    if (session && inOnboarding) {
      // onboarding routes stay accessible until completed
    }
  }, [demoMode, loading, router, segments, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      demoMode,
      signOut: async () => {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.auth.signOut();
        }
      },
    }),
    [demoMode, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
