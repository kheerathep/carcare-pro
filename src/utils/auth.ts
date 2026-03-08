// d:\carcare-pro\src\utils\auth.ts
import { supabase } from '../lib/supabase';

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
export const handleGoogleAuth = async (_isSignUp: boolean = false) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // 1. ชี้ไปหน้า Dashboard เหมือนเดิม
      redirectTo: `${window.location.origin}/dashboard`, 
      
      // 🔥 2. เพิ่ม queryParams ตรงนี้! เพื่อบังคับให้ Google โชว์หน้าเลือก Gmail เสมอ
      queryParams: {
        prompt: 'select_account', 
      },
    },
  });

  if (error) {
    throw error;
  }
  return data;
};
