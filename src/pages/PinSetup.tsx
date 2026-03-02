import { useState, useEffect } from 'react';
import { CarFront, Menu, Lock, ShieldCheck, Delete, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PinSetup() {
  // ควบคุมขั้นตอน: 1 = ตั้งรหัส, 2 = ยืนยันรหัส
  const [step, setStep] = useState<1 | 2>(1);
  
  // เก็บค่า PIN ที่กำลังพิมพ์
  const [pin, setPin] = useState<string>('');
  
  // เก็บค่า PIN จากขั้นตอนที่ 1 เพื่อเอามาเทียบในขั้นตอนที่ 2
  const [firstPin, setFirstPin] = useState<string>('');

  // ฟังก์ชันกดตัวเลข
  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  // ฟังก์ชันลบตัวเลข
  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // รองรับการพิมพ์จากคีย์บอร์ด
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  // เมื่อกดปุ่ม "ถัดไป" (จากขั้นตอนที่ 1)
  const handleNextStep = () => {
    if (pin.length !== 6) return;
    setFirstPin(pin); // จำรหัสแรกไว้
    setPin('');       // ล้างช่องใส่รหัสเพื่อเตรียมพิมพ์ยืนยัน
    setStep(2);       // ไปสเตป 2
  };

  // เมื่อกดปุ่ม "ย้อนกลับ" (จากขั้นตอนที่ 2)
  const handleBackStep = () => {
    setStep(1);
    setPin(firstPin); // เอารหัสที่เคยพิมพ์ไว้กลับมาโชว์
  };

  // เมื่อกดปุ่ม "ยืนยัน" (ขั้นตอนสุดท้าย)
  const handleSubmit = () => {
    if (pin.length !== 6) return;
    
    if (pin !== firstPin) {
      toast.error('รหัส PIN ไม่ตรงกัน กรุณาลองใหม่');
      setPin(''); // ล้างช่องให้พิมพ์ยืนยันใหม่
      return;
    }

    // TODO: ส่งรหัส PIN (firstPin) ไปบันทึกในฐานข้อมูล / Zustand
    toast.success('ตั้งค่ารหัส PIN สำเร็จ!');
    console.log('Final PIN to save:', firstPin);
  };

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
          <div className="text-center space-y-4 transition-all duration-300">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-500/10 mb-6 text-primary-600">
              {step === 1 ? <Lock size={32} /> : <ShieldCheck size={32} />}
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              {step === 1 ? 'ตั้งรหัส PIN 6 หลัก' : 'ยืนยันรหัส PIN อีกครั้ง'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-normal leading-relaxed">
              {step === 1 
                ? 'ใช้สำหรับเข้าใช้งานแอปในครั้งถัดไป' 
                : 'กรุณากรอกรหัส PIN 6 หลักเดิมอีกครั้งเพื่อให้แน่ใจว่าถูกต้อง'}
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
            {step === 1 ? (
              <button 
                onClick={handleNextStep}
                disabled={pin.length !== 6}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>ถัดไป</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSubmit}
                  disabled={pin.length !== 6}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={20} />
                  <span>ยืนยันและเข้าสู่ระบบ</span>
                </button>
                <button 
                  onClick={handleBackStep}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-12 px-5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-base font-bold transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>ย้อนกลับแก้ไขรหัส</span>
                </button>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}