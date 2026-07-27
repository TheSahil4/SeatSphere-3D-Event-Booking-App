import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, Role } from '@/types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: Role | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const idleState: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: false,
  role: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...idleState,
    loading: isSupabaseConfigured,
  });

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('Failed to load profile', error.message);
        return null;
      }
      return data as Profile | null;
    } catch (e) {
      console.error('Profile load error', e);
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ ...idleState, loading: false });
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const session = data.session;
        const user = session?.user ?? null;
        if (user) {
          loadProfile(user.id).then((profile) => {
            if (!active) return;
            setState({ session, user, profile, loading: false, role: profile?.role ?? null });
          });
        } else {
          setState({ session: null, user: null, profile: null, loading: false, role: null });
        }
      })
      .catch((err) => {
        console.error('Session restore error', err);
        if (active) setState({ ...idleState, loading: false });
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setState({ session: null, user: null, profile: null, loading: false, role: null });
        return;
      }
      const user = session.user;
      loadProfile(user.id).then((profile) => {
        if (!active) return;
        setState({ session, user, profile, loading: false, role: profile?.role ?? null });
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    setState({ ...idleState, loading: false });
  };

  const refreshProfile = async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((s) => ({ ...s, profile, role: profile?.role ?? null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
