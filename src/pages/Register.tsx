import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CarFront, Menu, User, Mail, EyeOff, Eye, ArrowRight, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { mapAuthErrorMessage, handleGoogleAuth } from '../utils/auth';
import { useAppStore } from '../store/useAppStore';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const { theme, toggleTheme } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  // ฟังก์ชันอัปเดตข้อมูลในฟอร์ม
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData({ ...formData, [id]: type === 'checkbox' ? checked : value });
  };

  // คำนวณความปลอดภัยของรหัสผ่านแบบ Real-time
  useEffect(() => {
    const p = formData.password;
    let s = 0;
    if (!p) { setStrength(0); return; }
    
    if (p.length >= 8) s++;     // ความยาว 8+
    if (/[A-Z]/.test(p)) s++;   // มีตัวพิมพ์ใหญ่
    if (/[a-z]/.test(p)) s++;   // มีตัวพิมพ์เล็ก
    if (/[0-9]/.test(p)) s++;   // มีตัวเลข
    setStrength(s);
  }, [formData.password]);

  // 1. ฟังก์ชันสมัครด้วย Google
  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await handleGoogleAuth(true);
    } catch (error) {
      // error is already handled by toast in handleGoogleAuth
    } finally {
      setIsLoading(false);
    }
  };

  // 2. ฟังก์ชันสมัครด้วย Email & Password
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้องเบื้องต้น
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    if (!formData.acceptTerms) {
      toast.error('กรุณายอมรับเงื่อนไขการใช้งาน');
      return;
    }
    // ตรวจสอบความปลอดภัยของรหัสผ่าน (ตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, 8 ตัวอักษรขึ้นไป)
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      setIsLoading(true);
      
      // ส่งข้อมูลไปสมัครที่ Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name, // บันทึกชื่อลงใน metadata ของผู้ใช้
          }
        }
      });

      if (error) throw error;

      if (session) {
        toast.success('สมัครสมาชิกสำเร็จ กรุณาตั้งค่า PIN เพื่อเริ่มใช้งาน');
        navigate('/pin-setup', { replace: true });
        return;
      }

      // ถ้าสมัครสำเร็จแต่ยังไม่มี session ปกติ Supabase จะส่งอีเมลยืนยัน
      toast.success('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี', { duration: 5000 });
      navigate('/login', { replace: true });
      
    } catch (error: any) {
      toast.error(mapAuthErrorMessage(error.message, true));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-3 bg-white/5 dark:bg-[#111a22]">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="text-primary-600">
             <CarFront size={28} />
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">CarCare Pro</h2>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-500 text-sm font-medium transition-colors" href="#">หน้าแรก</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-500 text-sm font-medium transition-colors" href="#">เกี่ยวกับเรา</a>
            <a className="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-500 text-sm font-medium transition-colors" href="#">ติดต่อเรา</a>
          </div>
          <Link
            to="/login"
            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            เข้าสู่ระบบ
          </Link>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors ml-auto md:ml-4 mr-2 md:mr-0"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Mobile Menu Icon */}
        <button className="md:hidden text-slate-900 dark:text-white">
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#192633] rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          
          {/* Hero Image inside card */}
          <div 
            className="h-32 w-full bg-cover bg-center relative" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1000&auto=format&fit=crop')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#192633] to-transparent dark:from-[#192633] from-black/60"></div>
            <div className="absolute bottom-4 left-6">
              <h1 className="text-white text-2xl font-bold tracking-tight">สมัครสมาชิกใหม่</h1>
              <p className="text-slate-200 text-sm font-medium">เริ่มต้นดูแลรถของคุณอย่างมืออาชีพ</p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Google Sign Up */}
            <button 
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#111a22] hover:bg-slate-50 dark:hover:bg-[#1a2530] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 h-12 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <svg className="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'สมัครด้วย Google'}</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs uppercase">หรือลงทะเบียนด้วยอีเมล</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            {/* Input Fields */}
            <form className="space-y-5" onSubmit={handleEmailSignUp}>
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <input 
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-12 px-4 pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-[#111a22] border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                    placeholder="กรอกชื่อและนามสกุลของคุณ" 
                    type="text"
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">อีเมล</label>
                <div className="relative">
                  <input 
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 px-4 pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-[#111a22] border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                    placeholder="example@email.com" 
                    type="email"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">รหัสผ่าน</label>
                <div className="relative group">
                  <input 
                    id="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-12 px-4 pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-[#111a22] border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                    placeholder="ตั้งรหัสผ่านของคุณ" 
                    type={showPassword ? "text" : "password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors cursor-pointer" 
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1 h-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                          strength > i
                            ? strength <= 2 ? 'bg-red-500' : strength === 3 ? 'bg-amber-500' : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs px-1">
                    <span className={strength <= 2 ? 'text-red-500' : strength === 3 ? 'text-amber-500' : 'text-emerald-500'}>
                      {formData.password ? (strength <= 2 ? 'ไม่ปลอดภัย' : strength === 3 ? 'พอใช้' : 'ปลอดภัยมาก') : ''}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">8+ ตัวอักษร, A-Z, a-z, 0-9</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ยืนยันรหัสผ่าน</label>
                <div className="relative group">
                  <input
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full h-12 px-4 pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-[#111a22] border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="ยืนยันรหัสผ่านของคุณ"
                    type={showPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors cursor-pointer"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-slate-50 dark:bg-[#111a22]"
                  />
                </div>
                <label htmlFor="acceptTerms" className="text-sm text-slate-600 dark:text-slate-400">
                  ฉันยอมรับ <a href="#" className="text-primary-600 dark:text-primary-500 hover:underline font-medium">เงื่อนไขการใช้งาน</a> และ <a href="#" className="text-primary-600 dark:text-primary-500 hover:underline font-medium">นโยบายความเป็นส่วนตัว</a>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all transform active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-50" 
              >
                <span>{isLoading ? 'กำลังโหลด...' : 'สมัครสมาชิก'}</span>
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </form>

            {/* Footer Link */}
            <div className="pt-2 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                มีบัญชีอยู่แล้ว? 
                <Link className="text-primary-600 dark:text-primary-500 hover:text-primary-700 font-semibold transition-colors ml-1" to="/login">เข้าสู่ระบบ</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}