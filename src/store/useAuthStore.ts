import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const PIN_VERIFIED_USER_STORAGE_KEY = 'carcare.pin_verified_user_id';

const getStoredPinVerifiedUserId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage.getItem(PIN_VERIFIED_USER_STORAGE_KEY);
  } catch {
    return null;
  }
};

const setStoredPinVerifiedUserId = (userId: string | null) => {
  if (typeof window === 'undefined') return;

  try {
    if (userId) {
      window.sessionStorage.setItem(PIN_VERIFIED_USER_STORAGE_KEY, userId);
      return;
    }

    window.sessionStorage.removeItem(PIN_VERIFIED_USER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to persist PIN verification state:', error);
  }
};

const resolvePinVerifiedStatus = (session: Session | null) => {
  const currentUserId = session?.user?.id;
  if (!currentUserId) return false;

  return getStoredPinVerifiedUserId() === currentUserId;
};

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPinVerified: boolean;

  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setPinVerified: (status: boolean) => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

let authSubscriptionInitialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isPinVerified: false,

  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user ?? null,
      isPinVerified: resolvePinVerifiedStatus(session),
    }),
  setUser: (user: User | null) => set({ user }),
  setPinVerified: (status: boolean) =>
    set((state) => {
      const verifiedUserId = status ? state.session?.user?.id ?? null : null;
      setStoredPinVerifiedUserId(verifiedUserId);

      return { isPinVerified: Boolean(verifiedUserId) };
    }),

  signOut: async () => {
    await supabase.auth.signOut();
    setStoredPinVerifiedUserId(null);
    set({ user: null, session: null, isPinVerified: false });
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to get session:', error);
      setStoredPinVerifiedUserId(null);
      set({ session: null, user: null, isPinVerified: false, isLoading: false });
    } else {
      if (!session) {
        setStoredPinVerifiedUserId(null);
      }

      set(() => ({
        session,
        user: session?.user ?? null,
        isPinVerified: resolvePinVerifiedStatus(session),
        isLoading: false,
      }));
    }

    if (!authSubscriptionInitialized) {
      authSubscriptionInitialized = true;

      supabase.auth.onAuthStateChange((_event, changedSession) => {
        if (!changedSession) {
          setStoredPinVerifiedUserId(null);
        }

        set(() => ({
          session: changedSession,
          user: changedSession?.user ?? null,
          isPinVerified: resolvePinVerifiedStatus(changedSession),
          isLoading: false,
        }));
      });
    }
  },
}));