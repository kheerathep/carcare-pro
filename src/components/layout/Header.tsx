import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Sun, Moon, AlertTriangle, CheckCircle, Info, Wrench } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/my-cars/')) {
    return 'รายละเอียดรถยนต์';
  }

  switch (pathname) {
    case '/my-cars':
      return 'รถของฉัน';
    case '/repairs':
      return 'บันทึกการซ่อม';
    case '/notifications':
      return 'ศูนย์การแจ้งเตือน';
    case '/settings':
      return 'การตั้งค่า';
    case '/dashboard':
    default:
      return 'ภาพรวมแดชบอร์ด';
  }
}

export default function Header() {
  const { theme, toggleTheme, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session); // 🔥 2. ดึง session มาใช้

  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const recentNotifications = notifications.slice(0, 5); // Show top 5 in dropdown

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-2 rounded-full transition-colors ${isNotificationOpen
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 dark:border-red-500/20">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notif) => {
                    let Icon = Info;
                    let iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
                    let highlightColor = 'bg-blue-500';

                    if (notif.type === 'urgent') { Icon = AlertTriangle; iconColor = 'text-red-500 bg-red-50 dark:bg-red-500/10'; highlightColor = 'bg-red-500'; }
                    else if (notif.type === 'warning') { Icon = AlertTriangle; iconColor = 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'; highlightColor = 'bg-orange-500'; }
                    else if (notif.type === 'maintenance') { Icon = Wrench; iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'; highlightColor = 'bg-emerald-500'; }
                    else if (notif.type === 'system') { Icon = CheckCircle; iconColor = 'text-slate-500 bg-slate-100 dark:bg-slate-500/10'; highlightColor = 'bg-slate-500'; }

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          navigate('/notifications');
                          setIsNotificationOpen(false);
                        }}
                        className={`px-5 py-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group relative ${notif.is_read ? 'opacity-70' : ''}`}
                      >
                        {!notif.is_read && <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-sm ${highlightColor}`}></div>}
                        <div className={`h-10 w-10 flex items-center justify-center shrink-0 rounded-full ${iconColor}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className={`text-[10px] mt-2 ${!notif.is_read ? 'font-semibold text-primary-600 dark:text-primary-400' : 'font-medium text-slate-400'}`}>
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: th })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    ไม่มีการแจ้งเตือน
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                <button
                  onClick={() => { navigate('/notifications'); setIsNotificationOpen(false); }}
                  className="w-full py-2.5 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-xl transition-all text-center"
                >
                  ดูการแจ้งเตือนทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            {/* 🔥 4. เปลี่ยนชื่อตรงนี้ */}
            <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">เจ้าของรถทั่วไป</p>
          </div>
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-2 ring-slate-200 dark:ring-slate-700 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
            {session?.user?.user_metadata?.avatar_url ? (
              <img src={session.user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0)
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
