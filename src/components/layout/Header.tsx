import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/my-cars/')) {
    return 'รายละเอียดรถยนต์';
  }

  switch (pathname) {
    case '/my-cars':
      return 'รถของฉัน';
    case '/repairs':
      return 'บันทึกการซ่อม';
    case '/dashboard':
    default:
      return 'ภาพรวมแดชบอร์ด';
  }
}

export default function Header() {
  const { theme, toggleTheme, toggleSidebar } = useAppStore();
  const location = useLocation();
  const session = useAuthStore((state) => state.session); // 🔥 2. ดึง session มาใช้
  // 🔥 3. ดึงอีเมลมาโชว์ (ตัดเอาแค่ชื่อหน้า @ ถ้าไม่มีชื่อจริง)
  const userEmail = session?.user?.email || 'ผู้ใช้งาน';
  const displayName = userEmail.split('@')[0];
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{pageTitle}</h2>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="สลับโหมดหน้าจอ"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            {/* 🔥 4. เปลี่ยนชื่อตรงนี้ */}
            <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">เจ้าของรถทั่วไป</p>
          </div>
          <div 
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-2 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-slate-500 font-bold uppercase" 
            /* 🔥 5. (ทางเลือก) เปลี่ยนรูปโปรไฟล์เป็นตัวอักษรย่อถ้าไม่มีรูป */
          >
            {displayName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
