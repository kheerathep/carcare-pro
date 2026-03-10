import { CarFront, LayoutDashboard, Settings, LogOut, Wrench, X, Bell, BarChart3, CalendarDays } from 'lucide-react';
import Logo from '../ui/Logo';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useAppStore();
  const signOut = useAuthStore((state) => state.signOut);
  const session = useAuthStore((state) => state.session);
  const userEmail = session?.user?.email || 'ผู้ใช้งาน';
  const displayName = userEmail.split('@')[0];

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center gap-3 px-3 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/30 transition-all shadow-sm font-bold'
      : 'flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors group font-medium';

  return (
    <>
      {/* 🔴 Overlay สีดำสำหรับมือถือ (คลิกเพื่อปิด Sidebar) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🔵 ตัว Sidebar หลัก (แก้ให้ Fixed 100vh) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-full w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col transition-transform duration-300 z-50 shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >

        {/* --- ส่วนหัว (โลโก้) --- */}
        <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <Logo size={40} className="shrink-0 drop-shadow-lg" />
            <div>
              <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">CarCare Pro</h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-widest">Management</p>
            </div>
          </div>
          {/* ปุ่มปิด Sidebar สำหรับมือถือ */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- ส่วนเมนูนำทาง (Scroll ได้ถ้าเมนูเยอะ) --- */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          <NavLink className={navItemClass} to="/dashboard" onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={20} />
            <span>แดชบอร์ด</span>
          </NavLink>

          <NavLink className={navItemClass} to="/appointments" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <CalendarDays size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>ตารางนัดหมาย</span>
              </>
            )}
          </NavLink>

          <NavLink className={navItemClass} to="/my-cars" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <CarFront size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>รถของฉัน</span>
              </>
            )}
          </NavLink>

          <NavLink className={navItemClass} to="/repairs" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <Wrench size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>บันทึกการซ่อม</span>
              </>
            )}
          </NavLink>

          <NavLink className={navItemClass} to="/analytics" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <BarChart3 size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>สถิติและวิเคราะห์</span>
              </>
            )}
          </NavLink>

          {/* ขีดคั่นแบ่งหมวดหมู่ */}
          <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

          <NavLink className={navItemClass} to="/notifications" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <Bell size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>การแจ้งเตือน</span>
              </>
            )}
          </NavLink>

          <NavLink className={navItemClass} to="/settings" onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <>
                <Settings size={20} className={isActive ? '' : 'group-hover:text-primary-500 transition-colors'} />
                <span>ตั้งค่าระบบ</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* --- ส่วนโปรไฟล์ด้านล่าง (อยู่ติดก้นเสมอ) --- */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-primary-600 flex items-center justify-center text-xs font-bold text-white uppercase border-2 border-white dark:border-slate-800 shrink-0">
              {session?.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                displayName.substring(0, 2)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
          >
            <LogOut size={18} />
            ออกจากระบบ
          </button>
        </div>

      </aside>
    </>
  );
}