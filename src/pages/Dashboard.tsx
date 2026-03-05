import { 
  CarFront, LayoutDashboard, History, BarChart3, Lock, LogOut, 
  Menu, Bell, PlusCircle, Wrench, Banknote, Calendar, 
  TrendingUp, MapPin, Store, MoreHorizontal, Plus, ShieldCheck, 
  ArrowRight, Sun, Moon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export default function Dashboard() {
  const { theme, toggleTheme, isSidebarOpen, toggleSidebar } = useAppStore();
  const { signOut } = useAuthStore(); // ดึงฟังก์ชันออกจากระบบมาใช้

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans min-h-screen flex overflow-hidden transition-colors duration-700">
      
      {/* Sidebar (Desktop) */}
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
          <a className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 transition-all shadow-sm" href="#">
            <LayoutDashboard size={20} />
            <span className="text-sm font-semibold">แดชบอร์ด</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group" href="#">
            <CarFront size={20} className="group-hover:text-primary-500 transition-colors" />
            <span className="text-sm font-medium">รถของฉัน</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group" href="#">
            <History size={20} className="group-hover:text-primary-500 transition-colors" />
            <span className="text-sm font-medium">ประวัติการซ่อม</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group" href="#">
            <BarChart3 size={20} className="group-hover:text-primary-500 transition-colors" />
            <span className="text-sm font-medium">การวิเคราะห์</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group" href="#">
            <Lock size={20} className="group-hover:text-primary-500 transition-colors" />
            <span className="text-sm font-medium">ตั้งค่า PIN</span>
          </a>
        </nav>

        {/* โปรไฟล์ด้านล่าง Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-primary-500 flex items-center justify-center text-xs font-bold text-white">
              SC
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">สมชาย ใจดี</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Basic Plan</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400/80 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-900/5 dark:from-primary-900/10 to-transparent pointer-events-none"></div>
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ภาพรวมแดชบอร์ด</h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* ปุ่มสลับ Dark/Light Mode */}
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
                <p className="text-sm font-medium text-slate-900 dark:text-white">สมชาย ใจดี</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">เจ้าของรถทั่วไป</p>
              </div>
              <div 
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-2 ring-slate-200 dark:ring-slate-700" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop')" }}
              ></div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Welcome Message & Quick Add */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ยินดีต้อนรับกลับ, คุณสมชาย 👋</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">นี่คือสรุปข้อมูลการดูแลรถยนต์ของคุณในวันนี้</p>
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-95">
                <PlusCircle size={20} />
                เพิ่มรายการซ่อมด่วน
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 group shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <CarFront size={24} />
                  </div>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">ทั้งหมด</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">รถทั้งหมด</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3 คัน</h4>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-emerald-500/50 transition-all duration-300 group shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Wrench size={24} />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    <TrendingUp size={14} /> +2
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">จำนวนการซ่อม</p>
                <div className="flex items-end gap-2 mt-1">
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">12 ครั้ง</h4>
                  <p className="text-emerald-500 text-xs mb-1.5">เดือนนี้</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-amber-500/50 transition-all duration-300 group shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Banknote size={24} />
                  </div>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">ปีนี้</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">ค่าใช้จ่ายรวม</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">฿45,000</h4>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-violet-500/50 transition-all duration-300 group shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Calendar size={24} />
                  </div>
                  <span className="flex h-3 w-3 relative mt-1 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">นัดหมายเร็วๆ นี้</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">2 รายการ</h4>
              </div>

            </div>

            {/* Tables and Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Repairs Table */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5 text-lg">
                    <History size={20} className="text-blue-500 dark:text-blue-400" />
                    ประวัติการซ่อมล่าสุด
                  </h3>
                  <a className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium transition-colors" href="#">ดูทั้งหมด</a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4">รถยนต์</th>
                        <th className="px-6 py-4">รายการซ่อม</th>
                        <th className="px-6 py-4">วันที่</th>
                        <th className="px-6 py-4 text-right">ค่าใช้จ่าย</th>
                        <th className="px-6 py-4 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                      {/* รายการจำลอง (ตัวอย่าง 1) */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3 whitespace-nowrap">
                          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-600" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?q=80&w=150&auto=format&fit=crop')" }}></div>
                          Toyota Camry
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">เปลี่ยนถ่ายน้ำมันเครื่อง</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">12 ต.ค. 2566</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white text-right font-semibold">฿1,200</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            เสร็จสิ้น
                          </span>
                        </td>
                      </tr>
                      {/* รายการจำลอง (ตัวอย่าง 2) */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3 whitespace-nowrap">
                          <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-600" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=150&auto=format&fit=crop')" }}></div>
                          Honda CR-V
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">เช็คระยะ 40,000 กม.</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">05 ต.ค. 2566</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white text-right font-semibold">฿4,500</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            เสร็จสิ้น
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col h-full shadow-sm shadow-slate-200/50 dark:shadow-black/20">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5 text-lg">
                    <Calendar size={20} className="text-purple-500 dark:text-purple-400" />
                    นัดหมายเร็วๆ นี้
                  </h3>
                  <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  
                  {/* Item 1 */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 dark:bg-orange-500/50 group-hover:bg-orange-500 transition-colors"></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded px-2 py-0.5 text-xs font-bold uppercase border border-orange-200 dark:border-orange-500/20">พรุ่งนี้</span>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">10:00 น.</span>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    </div>
                    <div className="pl-2">
                      <h4 className="text-slate-900 dark:text-white font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">ตรวจเช็คสภาพประจำปี</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-3">Toyota Camry - ทะเบียน กก 8888</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={14} /> ศูนย์บริการโตโยต้า พระราม 9
                      </div>
                    </div>
                  </div>

                  {/* Add New Appointment Button */}
                  <button className="w-full py-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium mt-auto group">
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                    สร้างนัดหมายใหม่
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}