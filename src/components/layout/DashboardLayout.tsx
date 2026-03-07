import { Outlet } from 'react-router-dom';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import { useAuthStore } from "../../store/useAuthStore";
export default function DashboardLayout() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans min-h-screen flex overflow-hidden transition-colors duration-300">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Effect */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/5 dark:from-primary-900/10 to-transparent pointer-events-none z-0"></div>
        
        <Header />
        
        {/* เนื้อหาหลักของแต่ละหน้าจะมาโผล่ตรงนี้ (ผ่าน Outlet) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}