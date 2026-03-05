import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const mapAuthErrorMessage = (errorMessage?: string, isSignUp: boolean = false) => {
  if (!errorMessage) return isSignUp ? 'เกิดข้อผิดพลาดในการสมัครสมาชิก' : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';

  const normalized = errorMessage.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  }

  if (normalized.includes('email not confirmed')) {
    return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  }

  if (normalized.includes('user already registered')) {
    return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบแทน';
  }

  return errorMessage;
};

export const handleGoogleAuth = async (isSignUp: boolean = false): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/pin-setup`,
      },
    });

    if (error) throw error;
  } catch (error: any) {
    toast.error(mapAuthErrorMessage(error.message, isSignUp));
    throw error;
  }
};
