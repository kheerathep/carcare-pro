import { supabase } from '../lib/supabase';

export const isValidPin = (pin: string) => /^\d{6}$/.test(pin);

const PIN_HASH_STORAGE_KEY_PREFIX = 'carcare.pin_hash.';

export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const getStoredPinHash = (userId: string): string | null => {
  if (typeof window === 'undefined' || !userId) return null;

  try {
    return window.sessionStorage.getItem(`${PIN_HASH_STORAGE_KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
};

export const setStoredPinHash = (userId: string, pinHash: string) => {
  if (typeof window === 'undefined' || !userId || !pinHash) return;

  try {
    window.sessionStorage.setItem(`${PIN_HASH_STORAGE_KEY_PREFIX}${userId}`, pinHash);
  } catch (error) {
    console.error('Failed to persist PIN hash in browser session:', error);
  }
};

export const clearStoredPinHash = (userId: string) => {
  if (typeof window === 'undefined' || !userId) return;

  try {
    window.sessionStorage.removeItem(`${PIN_HASH_STORAGE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear PIN hash from browser session:', error);
  }
};

export const getProfilePinHash = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.pin_hash ?? null;
};

export const saveProfilePinHash = async (userId: string, pinHash: string) => {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        pin_hash: pinHash,
      },
      { onConflict: 'id' },
    );

  if (error) {
    throw error;
  }
};
