// d:\carcare-pro\src\utils\auth.ts
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * Maps Supabase auth error messages to user-friendly Thai messages.
 * @param message The original error message from Supabase.
 * @param isSignUp A boolean to indicate if the context is sign-up.
 * @returns A user-friendly error message in Thai.
 */
export function mapAuthErrorMessage(message: string, isSignUp = false): string {
  console.error('Supabase Auth Error:', message); // Log original error for debugging

  if (message.includes('User already registered')) {
    return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น';
  }
  if (message.includes('Invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }
  if (message.includes('Email not confirmed')) {
    return 'บัญชียังไม่ถูกยืนยัน กรุณาตรวจสอบอีเมลของคุณ';
  }
  if (message.includes('Password should be at least')) {
    return 'รหัสผ่านไม่ปลอดภัย (ต้องมีอย่างน้อย 8 ตัวอักษร)';
  }
  if (message.includes('Unable to validate email address')) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
  }
  if (message.includes('Email rate limit exceeded')) {
      return 'ส่งคำขอถี่เกินไป กรุณาลองใหม่อีกครั้งในภายหลัง';
  }

  return isSignUp ? 'การสมัครสมาชิกล้มเหลว โปรดลองอีกครั้ง' : 'การเข้าสู่ระบบล้มเหลว โปรดลองอีกครั้ง';
}

/**
 * Handles Google OAuth sign-in or sign-up.
 * This will now always prompt the user to select an account.
 * @param isSignUp A boolean to indicate if the context is sign-up.
 */
export async function handleGoogleAuth(isSignUp: boolean) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/pin-setup`,
      queryParams: {
        prompt: 'select_account', // เพิ่มส่วนนี้เพื่อให้ผู้ใช้เลือกบัญชีทุกครั้ง
      },
    },
  });

  if (error) {
    toast.error(mapAuthErrorMessage(error.message, isSignUp));
    throw error;
  }
}
