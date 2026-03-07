import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Menu, CarFront, EyeOff, Eye, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { mapAuthErrorMessage, handleGoogleAuth } from '../utils/auth';
import { useAppStore } from '../store/useAppStore';



export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  // ฟังก์ชันสำหรับ Login ด้วย Google
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await handleGoogleAuth(false);
    } catch {
      // error is already handled by toast in handleGoogleAuth
    } finally {
      setIsLoading(false);
    }
  };

 const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('เข้าสู่ระบบสำเร็จ');
      
      navigate('/login-pin', { replace: true }); 
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(mapAuthErrorMessage(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] font-sans min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-3 bg-white/5 dark:bg-[#111a22]">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="text-primary-600">
            <CarFront size={28} />
          </div>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">CarCare Pro</h2>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end gap-8">
          <Link
            to="/register"
            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary-600 hover:bg-primary-700 transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]"
          >
            <span className="truncate">สมัครสมาชิก</span>
          </Link>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2 ml-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="สลับโหมดหน้าจอ"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* เมนูมือถือ */}
        <div className="md:hidden text-slate-900 dark:text-white ml-2">
          <Menu size={24} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#192633] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Hero Image / Header within card */}
          <div 
            className="h-32 bg-cover bg-center relative" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#192633] to-transparent dark:from-[#192633] from-white/90"></div>
            <div className="absolute bottom-4 left-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">ยินดีต้อนรับกลับ</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">เข้าสู่ระบบเพื่อจัดการข้อมูลรถของคุณ</p>
            </div>
          </div>

          <div className="p-6 pt-2">
            <form className="flex flex-col gap-5 mt-4" onSubmit={handleEmailLogin}>
              
              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="email">อีเมล</label>
                <div className="relative">
                  <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-500 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#111a22] focus:border-primary-500 h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal" id="email" placeholder="example@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="password">รหัสผ่าน</label>
                  <Link className="text-primary-600 text-xs font-medium hover:underline dark:text-primary-500" to="/forgot-password">ลืมรหัสผ่าน?</Link>
                </div>
                <div className="relative flex w-full items-stretch">
                  <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary-500 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#111a22] focus:border-primary-500 h-12 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-base font-normal leading-normal border-r-0" id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button 
                    className="flex items-center justify-center px-4 rounded-r-lg border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#111a22] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer" 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 transition-all text-white text-base font-bold leading-normal tracking-[0.015em] shadow-md shadow-primary-500/20 disabled:opacity-50" type="submit" disabled={isLoading}>
                <span className="truncate">{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">หรือ</p>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
              </div>

              {/* Google Login Button */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#111a22] hover:bg-slate-50 dark:hover:bg-[#1a2530] transition-colors text-slate-700 dark:text-slate-200 text-sm font-medium leading-normal disabled:opacity-50" 
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>

            
            
            </form>
          </div>

          {/* Footer Area inside card */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#111a22] border-t border-slate-200 dark:border-slate-800 flex justify-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              ยังไม่มีบัญชี? <Link className="text-primary-600 dark:text-primary-500 font-semibold hover:underline ml-1" to="/register">สมัครสมาชิก</Link>
            </p>
          </div>
          
        </div>
      </main>
    </div>
  );
}
