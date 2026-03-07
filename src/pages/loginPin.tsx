import { useEffect, useState } from 'react';
import { CarFront, Delete, Lock, Mail, X, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { getProfilePinHash, getStoredPinHash, hashPin, isValidPin, setStoredPinHash } from '../utils/pin';
import { usePinKeypad } from '../hooks/usePinKeypad';

export default function LoginPin() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();
  const session = useAuthStore((state) => state.session);
  const isPinVerified = useAuthStore((state) => state.isPinVerified);
  const setPinVerified = useAuthStore((state) => state.setPinVerified);
  const signOut = useAuthStore((state) => state.signOut);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }

    if (!isValidPin(pin)) {
      toast.error('กรุณากรอกรหัส PIN 6 หลักให้ครบ');
      return;
    }

    const activeUser = session?.user;
    if (!activeUser) {
      toast.error('กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านก่อนใช้งาน PIN');
      navigate('/login', { replace: true });
      return;
    }

    const activeEmail = activeUser.email?.toLowerCase();
    if (!activeEmail || activeEmail !== normalizedEmail) {
      toast.error('อีเมลไม่ตรงกับบัญชีที่กำลังใช้งานในเบราว์เซอร์นี้');
      return;
    }

    try {
      setIsLoading(true);
      let pinHashForVerification = getStoredPinHash(activeUser.id);

      if (!pinHashForVerification) {
        pinHashForVerification = await getProfilePinHash(activeUser.id);

        if (pinHashForVerification) {
          setStoredPinHash(activeUser.id, pinHashForVerification);
        }
      }

      if (!pinHashForVerification) {
        toast.error('ไม่พบ PIN ของบัญชีนี้ กรุณาตั้งค่า PIN ใหม่');
        navigate('/pin-setup', { replace: true });
        return;
      }

      const enteredPinHash = await hashPin(pin);

      if (enteredPinHash !== pinHashForVerification) {
        toast.error('รหัส PIN ไม่ถูกต้อง');
        setPin('');
        return;
      }

      setPinVerified(true);
      toast.success('เข้าสู่ระบบด้วย PIN สำเร็จ');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('ไม่สามารถตรวจสอบ PIN ได้ กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const { pin, setPin, handleNumberClick, handleBackspace, handleClearPin } = usePinKeypad({
    isDisabled: isLoading,
    onEnter: () => void handlePinLogin(),
  });

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (isPinVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [isPinVerified, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('ออกจากระบบเรียบร้อย');
      navigate('/login', { replace: true });
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <header className="relative z-[100] flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 bg-slate-50 dark:bg-[#101922]">
        <div className="flex items-center gap-3 text-primary-600">
          <CarFront size={28} />
          <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">CarCare Pro</h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md transition-all active:scale-95"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[520px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight mb-2">เข้าใช้งานด้วยรหัส PIN</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">กรุณากรอกอีเมลและรหัส PIN 6 หลักเพื่อเข้าสู่ระบบ</p>
          </div>

          <div className="mb-8">
            <label htmlFor="pin-email" className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">อีเมล</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="pin-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="example@email.com"
                type="email"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">รหัส PIN 6 หลัก</label>
            <div className="flex justify-between gap-2 md:gap-4 max-w-sm mx-auto">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-16 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg border-2 flex items-center justify-center transition-colors ${pin.length > index
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                    }`}
                >
                  {pin.length > index ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-[320px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((number) => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={isLoading}
                className="h-14 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xl font-bold transition-colors disabled:opacity-50"
                type="button"
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleClearPin}
              disabled={isLoading}
              type="button"
              className="h-14 flex items-center justify-center rounded-xl bg-transparent text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              disabled={isLoading}
              className="h-14 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xl font-bold transition-colors disabled:opacity-50"
              type="button"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              disabled={isLoading}
              className="h-14 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              type="button"
            >
              <Delete size={20} />
            </button>
          </div>

          <button
            onClick={() => void handlePinLogin()}
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary-500/20 transition-all mb-6 disabled:opacity-50"
            type="button"
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>

          {!session && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400 mb-4">
              สำหรับการเข้าใช้งานด้วย PIN ต้องล็อกอินด้วยอีเมล/รหัสผ่านอย่างน้อย 1 ครั้งในเบราว์เซอร์นี้ก่อน
            </p>
          )}

          <div className="flex flex-col gap-3 items-center text-sm font-medium">
            <Link
              to="/forgot-pin"
              className="text-primary-600 dark:text-primary-500 hover:underline"
            >
              ลืมรหัส PIN?
            </Link>
            <Link
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-2"
              to="/login"
            >
              <Lock size={14} />
              กลับไปใช้รหัสผ่านปกติ
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-slate-500 dark:text-slate-600 text-xs">
        <p>© 2024 CarCare Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}
