import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import { useAppStore } from './store/useAppStore';

function App() {
  // 1. ดึงค่า theme จาก Store มาใช้งาน
  const theme = useAppStore((state) => state.theme);

  // 2. ใช้ useEffect เพื่อคอยดูว่าถ้าค่า theme เปลี่ยน ให้ไปแก้ Class ที่ <html>
  useEffect(() => {
    const root = document.documentElement;
    
    // เพิ่ม setTimeout เพื่อหน่วงเวลาการเปลี่ยน Class (เช่น 300ms = 0.3 วินาที)
    const timer = setTimeout(() => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }, 100);

    // Cleanup function: ล้าง timer เก่าทิ้งถ้ามีการเปลี่ยนค่าใหม่เข้ามาก่อนครบเวลา
    return () => clearTimeout(timer);
  }, [theme]); // ทำงานทุกครั้งที่ค่า theme เปลี่ยน

  return (
    <>
      {/* Router หลักของแอป */}
      <AppRouter />
      
      {/* ตัวแจ้งเตือน Toast (วางไว้ตรงนี้เพื่อให้แสดงผลทับทุกหน้า) */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
        }}
      />
    </>
  );
}


export default App;
