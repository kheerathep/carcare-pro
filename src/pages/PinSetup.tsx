import { useState, useEffect } from 'react';
import { CarFront, Menu, Lock, ShieldCheck, Delete, ArrowRight, ArrowLeft, RotateCcw, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { hashPin, isValidPin, saveProfilePinHash, setStoredPinHash, getProfilePinHash } from '../utils/pin';
import { usePinKeypad } from '../hooks/usePinKeypad';

export default function PinSetup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppStore();
  const session = useAuthStore((state) => state.session);
  const setPinVerified = useAuthStore((state) => state.setPinVerified);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mode, setMode] = useState<'setup' | 'verify'>('setup');
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [dbPinHash, setDbPinHash] = useState<string | null>(null);

  // ควบคุมขั้นตอน: 1 = ตั้งรหัส, 2 = ยืนยันรหัส
  const [step, setStep] = useState<1 | 2>(1);
  
  // เก็บค่า PIN จากขั้นตอนที่ 1 เพื่อเอามาเทียบในขั้นตอนที่ 2
  const [firstPin, setFirstPin] = useState<string>('');

  useEffect(() => {
    async function checkExistingPin() {
      if (!session?.user?.id) return;
      try {
        const hash = await getProfilePinHash(session.user.id);
        if (hash) {
          setDbPinHash(hash);
          setMode('verify');
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
      } finally {
        setIsLoadingCheck(false);
      }
    }
    checkExistingPin();
  }, [session?.user?.id]);

  const { pin, setPin, handleNumberClick, handleBackspace } = usePinKeypad({
    isDisabled: isSubmitting || isLoadingCheck,
    onEnter: () => {
      if (mode === 'verify') {
        void handleVerify();
      } else {
        if (step === 1) {
          handleNextStep();
        } else {
          void handleSubmit();
        }
      }
    }
  });

  // เมื่อกดปุ่ม "ถัดไป" (จากขั้นตอนที่ 1)
  function handleNextStep() {
    if (!isValidPin(pin)) return;
    setFirstPin(pin); // จำรหัสแรกไว้
    setPin('');       // ล้างช่องใส่รหัสเพื่อเตรียมพิมพ์ยืนยัน
    setStep(2);       // ไปสเตป 2
  }

  // เมื่อกดปุ่ม "ย้อนกลับ" (จากขั้นตอนที่ 2)
  function handleBackStep() {
    setStep(1);
    setPin(firstPin); // เอารหัสที่เคยพิมพ์ไว้กลับมาโชว์
  }

  // สำหรับโหมด Verify (ผู้ใช้เก่า)
  async function handleVerify() {
    if (!isValidPin(pin)) return;
    
    if (!dbPinHash || !session?.user?.id) {
      toast.error('ไม่พบข้อมูล PIN กรุณาตั้งค่าใหม่');
      setMode('setup');
      return;
    }

    try {
      setIsSubmitting(true);
      const inputHash = await hashPin(pin);
      
      if (inputHash === dbPinHash) {
        setStoredPinHash(session.user.id, inputHash);
        setPinVerified(true);
        toast.success('ยินดีต้อนรับกลับ');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('รหัส PIN ไม่ถูกต้อง');
        setPin('');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ');
    } finally {
      setIsSubmitting(false);
    }
  }

  // เมื่อกดปุ่ม "ยืนยัน" (ขั้นตอนสุดท้าย)
  async function handleSubmit() {
    if (!isValidPin(pin)) return;
    
    if (pin !== firstPin) {
      toast.error('รหัส PIN ไม่ตรงกัน กรุณาลองใหม่');
      setPin(''); // ล้างช่องให้พิมพ์ยืนยันใหม่
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      toast.error('ไม่พบเซสชันผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setIsSubmitting(true);
      const pinHash = await hashPin(pin);
      await saveProfilePinHash(userId, pinHash);
      setStoredPinHash(userId, pinHash);

      setPinVerified(true);
      toast.success('ตั้งค่ารหัส PIN สำเร็จ!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Failed to save PIN:', error);
      toast.error(`บันทึกไม่สำเร็จ: ${error.message || 'โปรดตรวจสอบฐานข้อมูลหรือ RLS'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetRequest() {
    setMode('setup');
    setStep(1);
    setPin('');
    setFirstPin('');
  }

  return (
    <div className="bg-slate-50 dark:bg-[#101922] font-sans min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 antialiased selection:bg-primary-500/30 selection:text-primary-600 transition-colors duration-200">
      
      {/* Navbar */}
      <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111a22] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10 text-primary-600">
                <CarFront size={20} />
              </div>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">CarCare Pro</h2>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors ml-auto mr-4"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center justify-center h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-all shadow-sm shadow-primary-500/20">
                เข้าสู่ระบบ
              </button>
              <button className="md:hidden p-2 text-slate-500 dark:text-slate-400">
                <Menu size={24} />
              </button>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative">
        
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500 blur-[120px]"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600 blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#1c2a38] p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-10 relative overflow-hidden">
          
          {/* Header Section เปลี่ยนตาม Step */}
          {isLoadingCheck ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
            <div className="text-center space-y-4 transition-all duration-300">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-500/10 mb-6 text-primary-600">
              {mode === 'verify' ? <Lock size={32} /> : (step === 1 ? <Lock size={32} /> : <ShieldCheck size={32} />)}
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              {mode === 'verify' ? 'กรุณากรอกรหัส PIN' : (step === 1 ? 'ตั้งรหัส PIN 6 หลัก' : 'ยืนยันรหัส PIN อีกครั้ง')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed">
              {mode === 'verify' ? 'เพื่อยืนยันตัวตนเข้าใช้งาน' : (step === 1 ? 'ใช้สำหรับเข้าใช้งานแอปในครั้งถัดไป' : 'กรุณากรอกรหัส PIN 6 หลักเดิมอีกครั้งเพื่อให้แน่ใจว่าถูกต้อง')}
            </p>
          </div>

          {/* PIN Inputs (Dots) */}
          <div className="flex justify-center py-2">
            <fieldset className="flex gap-2 sm:gap-3">
              {[...Array(6)].map((_, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-center h-12 w-10 sm:h-14 sm:w-12 rounded-lg text-xl font-bold border-2 transition-all shadow-sm
                    ${pin.length > index 
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-slate-900 dark:text-white' 
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-transparent'
                    }`}
                >
                  {pin.length > index ? '•' : ''}
                </div>
              ))}
            </fieldset>
          </div>

          {/* On-Screen Keypad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto mb-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button 
                key={num}
                onClick={() => handleNumberClick(num)}
                className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-semibold transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            
            <div className="h-12 w-full"></div> {/* ช่องว่างตรงซ้ายล่าง */}
            
            <button 
              onClick={() => handleNumberClick('0')}
              className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-lg font-semibold transition-colors active:scale-95"
            >
              0
            </button>
            
            <button 
              onClick={handleBackspace}
              className="flex items-center justify-center h-12 w-full rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors group active:scale-95"
            >
              <Delete size={24} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {mode === 'verify' ? (
              <>
                <button 
                  onClick={handleVerify}
                  disabled={pin.length !== 6 || isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={20} />
                  <span>{isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าใช้งาน'}</span>
                </button>
                <button 
                  onClick={handleResetRequest}
                  disabled={isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-base font-bold transition-colors"
                >
                  <RotateCcw size={20} />
                  <span>ลืมรหัส PIN / ตั้งค่าใหม่</span>
                </button>
              </>
            ) : step === 1 ? (
              <button 
                onClick={handleNextStep}
                disabled={pin.length !== 6 || isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>ถัดไป</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSubmit}
                  disabled={pin.length !== 6 || isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={20} />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันและเข้าสู่ระบบ'}</span>
                </button>
                <button 
                  onClick={handleBackStep}
                  disabled={isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-base font-bold transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>ย้อนกลับแก้ไขรหัส</span>
                </button>
              </>
            )}
          </div>
          </>
          )}

        </div>
      </main>
    </div>
  );
}