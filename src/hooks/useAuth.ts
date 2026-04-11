import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role: 'admin' | 'user';
  google_email: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single source of truth — onAuthStateChange handles everything.
    // It fires immediately on mount with the current session (or null),
    // so we don't need a separate getSession() call.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          if (session.provider_token) {
            try {
              await supabase
                .from('profiles')
                .update({
                  google_email: session.user!.email,
                  google_access_token: session.provider_token,
                  ...(session.provider_refresh_token && {
                    google_refresh_token: session.provider_refresh_token,
                  }),
                  google_token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
                })
                .eq('id', session.user!.id);
            } catch (err) {
              console.error('Failed to save Google tokens:', err);
            }
          }
          await fetchProfile(session.user!.id);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin + '/queue',
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username?: string,
    role: 'admin' | 'user' = 'user'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username || email.split('@')[0],
            role,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      await fetchProfile(user.id);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.role === 'admin',
    hasGmailConnected: !!profile?.google_refresh_token,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
  };
};