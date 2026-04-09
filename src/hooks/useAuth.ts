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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // If the user just signed in via Google AND we got tokens back,
        // save those tokens to their profile so we can send emails later.
        if (session.provider_token) {
          const expiryTime = new Date(Date.now() + 3600 * 1000).toISOString();
          await supabase
            .from('profiles')
            .update({
              google_email: session.user.email,
              google_access_token: session.provider_token,
              // provider_refresh_token is only present on first login
              // or when we force the consent screen (which we do — see signInWithGoogle)
              ...(session.provider_refresh_token && {
                google_refresh_token: session.provider_refresh_token,
              }),
              google_token_expiry: expiryTime,
            })
            .eq('id', session.user.id);
        }

        fetchProfile(session.user.id);
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

  // ── Email + password sign in (existing) ──────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  // ── Google OAuth sign in (new) ───────────────────────────────────────
  // This opens a Google popup/redirect asking for:
  //   - Basic profile (email, name)
  //   - Gmail send permission
  // We use access_type=offline + prompt=consent to always get a refresh token.
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
          ].join(' '),
          queryParams: {
            access_type: 'offline',  // gives us a refresh token
            prompt: 'consent',        // always show consent screen so refresh token is returned
          },
          redirectTo: window.location.origin + '/queue',
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
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
            role: role,
          },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error);
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
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const isAdmin = profile?.role === 'admin';
  const hasGmailConnected = !!profile?.google_refresh_token;

  return {
    user,
    profile,
    session,
    loading,
    isAdmin,
    hasGmailConnected,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
  };
};