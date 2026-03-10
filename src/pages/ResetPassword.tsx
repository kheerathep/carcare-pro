import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EyeOff, Eye, CheckCircle2, Circle, Sun, Moon } from 'lucide-react';
import Logo from '../components/ui/Logo';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // คำนวณความปลอดภัยของรหัสผ่านแบบ Real-time
  useEffect(() => {
    let s = 0;
    if (!password) {
      setStrength(0);
      setHasNumber(false);
      setHasSpecialChar(false);
      return;
    }

    if (password.length >= 8) s++;

    const numMatch = /[0-9]/.test(password);
    setHasNumber(numMatch);
    if (numMatch) s++;

    const specialMatch = /[^A-Za-z0-9]/.test(password);
    setHasSpecialChar(specialMatch);
    if (specialMatch) s++;

    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;

    setStrength(Math.min(s, 4));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('กรุณากรอกรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    // ตรวจสอบความปลอดภัยของรหัสผ่าน
    if (password.length < 8) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthLabel = () => {
    if (strength <= 1) return 'อ่อน';
    if (strength === 2) return 'ปานกลาง';
    if (strength >= 3) return 'ปลอดภัยมาก';
    return '';
  };

  const getStrengthColor = () => {
    if (strength <= 1) return 'text-red-500';
    if (strength === 2) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getStrengthBgColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-slate-100 font-sans min-h-screen flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-10 py-3 bg-white dark:bg-[#111a22] sticky top-0 z-50">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
          <Logo size={32} />
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
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-slate-100 dark:bg-[#192633] text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">เข้าสู่ระบบ</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:px-8">
        <div className="w-full max-w-[480px] flex flex-col gap-6">
          {/* Page Title & Subtitle */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-slate-500 dark:text-[#92adc9] text-base font-normal leading-normal">
              กรุณากรอกรหัสผ่านใหม่ของคุณเพื่อเข้าใช้งานระบบ
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-base font-medium leading-normal">
                รหัสผ่านใหม่
              </label>
              <div className="relative flex w-full items-center rounded-lg shadow-sm">
                <input
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-500 border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#192633] h-12 placeholder:text-slate-400 dark:placeholder-[#92adc9] px-4 text-base font-normal leading-normal transition-all border-r-0"
                  placeholder="กรอกรหัสผ่านใหม่"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center justify-center px-4 h-12 rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-[#192633] text-slate-400 dark:text-[#92adc9] hover:text-primary-600 dark:hover:text-primary-500 transition-colors cursor-pointer"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* Strength Indicator */}
            {password && (
              <div className="flex flex-col gap-2 rounded-lg bg-slate-50 dark:bg-[#192633]/50 p-4 border border-slate-200 dark:border-slate-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700 dark:text-white text-sm font-medium leading-normal">ความปลอดภัยของรหัสผ่าน</p>
                  <span className={`text-sm font-bold ${getStrengthColor()}`}>{getStrengthLabel()}</span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getStrengthBgColor()}`}
                    style={{ width: `${(strength / 4) * 100}%` }}
                  ></div>
                </div>

                <div className="flex flex-wrap gap-3 mt-1">
                  <span className={`text-xs flex items-center gap-1 ${password.length >= 8 ? 'text-primary-600 dark:text-primary-500' : 'text-slate-500 dark:text-[#92adc9]'}`}>
                    {password.length >= 8 ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    8+ ตัวอักษร
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${hasNumber ? 'text-primary-600 dark:text-primary-500' : 'text-slate-500 dark:text-[#92adc9]'}`}>
                    {hasNumber ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    ตัวเลข
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${hasSpecialChar ? 'text-primary-600 dark:text-primary-500' : 'text-slate-500 dark:text-[#92adc9]'}`}>
                    {hasSpecialChar ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    อักขระพิเศษ
                  </span>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-900 dark:text-white text-base font-medium leading-normal">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative flex w-full items-center rounded-lg shadow-sm">
                <input
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-500 border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#192633] h-12 placeholder:text-slate-400 dark:placeholder-[#92adc9] px-4 text-base font-normal leading-normal transition-all border-r-0"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="flex items-center justify-center px-4 h-12 rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-[#192633] text-slate-400 dark:text-[#92adc9] hover:text-primary-600 dark:hover:text-primary-500 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
              className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
            >
              <span className="truncate">{isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Footer Decoration */}
      <div className="h-20 w-full"></div>
    </div>
  );
}
