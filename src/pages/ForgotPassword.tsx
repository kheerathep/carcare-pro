import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CarFront, ArrowLeft, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function ForgotPassword() {
  const { theme, toggleTheme } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว');
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] font-sans min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-3 bg-white dark:bg-[#111a22]">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="text-primary-600">
            <CarFront size={28} />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">CarCare Pro</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 mr-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/login"
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors"
          >
            <span className="truncate">เข้าสู่ระบบ</span>
          </Link>
          <Link
            to="/register"
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="truncate">สมัครสมาชิก</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center items-center px-4 py-12">
        <div className="flex flex-col w-full max-w-[480px]">
          {/* Forgot Password Card */}
          <div className="bg-white dark:bg-[#192633] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 flex flex-col gap-6">
              {/* Header Text */}
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">ลืมรหัสผ่าน</h1>
                <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal leading-normal">
                  {isSuccess 
                    ? "กรุณาตรวจสอบกล่องจดหมายของคุณ เพื่อคลิกลิงก์ตั้งรหัสผ่านใหม่" 
                    : "กรุณากรอกอีเมลที่ใช้สมัครสมาชิก เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่"
                  }
                </p>
              </div>

              {/* Input Form */}
              {!isSuccess && (
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  <label className="flex flex-col w-full gap-2">
                    <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">อีเมล</span>
                    <div className="relative flex w-full items-center">
                      <input
                        className="flex w-full rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-500/50 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#101922] h-12 px-4 text-base font-normal leading-normal placeholder:text-slate-400 dark:placeholder:text-[#64748b]"
                        placeholder="example@email.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </label>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
                  >
                    <span className="truncate">{isLoading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}</span>
                  </button>
                </form>
              )}

              {/* Back Link */}
              <div className="flex justify-center pt-2">
                <Link
                  to="/login"
                  className="group flex items-center gap-2 text-slate-500 dark:text-[#92adc9] text-sm font-medium hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                >
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Footer Help Text */}
          <p className="text-slate-400 dark:text-slate-600 text-xs text-center mt-8">
            © {new Date().getFullYear()} CarCare Pro. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
