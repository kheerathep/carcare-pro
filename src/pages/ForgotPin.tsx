import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, CheckCircle, RefreshCw, Sun, Moon, HelpCircle, Lock } from 'lucide-react'
import Logo from '../components/ui/Logo';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export default function ForgotPin() {
  const { theme, toggleTheme } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // ระบบนับเวลาถอยหลังเมื่อส่งอีเมลแล้ว
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>; // 👈 แก้เป็นคำนี้ครับ
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // ฟังก์ชันส่งอีเมลขอรีเซ็ต
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('กรุณากรอกอีเมลของคุณ');
      return;
    }

    try {
      setIsLoading(true);

      // ส่งคำสั่ง Reset Password ไปยัง Supabase (เพื่อใช้ยืนยันตัวตนก่อนตั้ง PIN ใหม่)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/pin-setup`,
      });

      if (error) throw error;

      setStep(2);
      setCountdown(60); // เริ่มนับเวลาถอยหลัง 60 วินาทีใหม่
      toast.success('ส่งลิงก์รีเซ็ตสำเร็จ!');
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการส่งอีเมล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    handleSendResetLink({ preventDefault: () => { } } as React.FormEvent);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans transition-colors duration-300">

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Theme Toggle Button (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shadow-sm bg-white/50 dark:bg-black/20 backdrop-blur-md"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={64} className="drop-shadow-xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">CarCare Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ระบบจัดการรถยนต์ครบวงจร</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#1c2a38] border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-8 backdrop-blur-sm relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>

          {step === 1 ? (
            /* ================= STEP 1: ฟอร์มกรอกอีเมล ================= */
            <div className="animate-[fadeIn_0.5s_ease-out]">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4 relative group">
                  <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-pulse"></div>
                  <Lock size={36} className="text-primary-600 dark:text-primary-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">ลืมรหัส PIN</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 max-w-xs leading-relaxed">
                  กรุณากรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์สำหรับตั้งรหัส PIN ใหม่ให้คุณ
                </p>
              </div>

              <form onSubmit={handleSendResetLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">
                    อีเมล (Email)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm disabled:opacity-50"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary-500/25 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-[#1c2a38] transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">กำลังส่งข้อมูล...</span>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      ส่งลิงก์รีเซ็ต
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-[#1c2a38] text-slate-500 dark:text-slate-400">หรือ</span>
                </div>
              </div>

              <div className="text-center">
                <Link to="/login-pin" className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group">
                  <ArrowLeft size={16} className="mr-1 transform group-hover:-translate-x-1 transition-transform" />
                  กลับไปหน้าเข้าสู่ระบบ PIN
                </Link>
              </div>
            </div>
          ) : (
            /* ================= STEP 2: หน้าส่งอีเมลสำเร็จ ================= */
            <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center text-center">
              <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center relative border border-green-200 dark:border-green-500/20 transition-colors duration-300">
                  <Send size={36} className="text-green-600 dark:text-green-500 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-[#1c2a38] rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">ส่งอีเมลเรียบร้อยแล้ว</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                เราได้ส่งลิงก์สำหรับรีเซ็ตรหัส PIN ไปยังอีเมลของคุณแล้ว<br />
                <span className="text-slate-900 dark:text-white font-medium">{email}</span><br />
                กรุณาตรวจสอบในกล่องจดหมายของคุณ
              </p>

              <div className="w-full space-y-4">
                <Link to="/login" className="flex items-center justify-center w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 transform hover:-translate-y-0.5">
                  ไปที่หน้าเข้าสู่ระบบปกติ
                </Link>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ยังไม่ได้รับอีเมล?</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {countdown > 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      สามารถขอรหัสใหม่ได้ใน <span className="text-primary-600 dark:text-primary-400 font-mono font-medium">00:{countdown.toString().padStart(2, '0')}</span> นาที
                    </p>
                  ) : null}
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || isLoading}
                    className={`w-full py-3 px-4 font-medium rounded-xl border flex items-center justify-center gap-2 transition-all ${countdown > 0
                        ? 'bg-slate-50 dark:bg-[#101922] text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-[#1c2a38] text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-500/30 hover:bg-primary-50 dark:hover:bg-primary-500/10 cursor-pointer'
                      }`}
                  >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'กำลังส่ง...' : 'ส่งอีเมลอีกครั้ง'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link to="#" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <HelpCircle size={18} />
            ต้องการความช่วยเหลือ?
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            © 2024 CarCare Pro. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}