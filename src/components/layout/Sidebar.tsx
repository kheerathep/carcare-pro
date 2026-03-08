import { CarFront, LayoutDashboard, Lock, LogOut, Wrench } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function Sidebar() {
  const { isSidebarOpen } = useAppStore();
  const { signOut } = useAuthStore();
  const session = useAuthStore((state) => state.session);
  const userEmail = session?.user?.email || 'ผู้ใช้งาน';
  const displayName = userEmail.split('@')[0];
  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center gap-3 px-3 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 transition-all shadow-sm'
      : 'flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group';

  return (
    <aside className={`w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 flex-col h-screen sticky top-0 transition-transform duration-300 z-40 ${isSidebarOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden md:flex'}`}>
      
      {/* โลโก้แอป */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <CarFront size={24} />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">CarCare Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-normal">ดูแลรถครบวงจร</p>
        </div>
      </div>

      {/* เมนูนำทาง */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-1.5 overflow-y-auto">
        <NavLink className={navItemClass} to="/dashboard">
          <LayoutDashboard size={20} />
          <span className="text-sm font-semibold">แดชบอร์ด</span>
        </NavLink>
        <NavLink className={navItemClass} to="/my-cars">
          {({ isActive }) => (
            <>
              <CarFront size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>รถของฉัน</span>
            </>
          )}
        </NavLink>
        <NavLink className={navItemClass} to="/repairs">
          {({ isActive }) => (
            <>
              <Wrench size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>บันทึกการซ่อม</span>
            </>
          )}
        </NavLink>
        <a className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group" href="#">
          <Lock size={20} className="group-hover:text-primary-500 transition-colors" />
          <span className="text-sm font-medium">ตั้งค่า PIN</span>
        </a>
      </nav>

      {/* โปรไฟล์ด้านล่าง */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-primary-500 flex items-center justify-center text-xs font-bold text-white uppercase">
            {displayName.substring(0, 2)} {/* ตัวย่อ 2 ตัวแรก */}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span className="text-sm font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
