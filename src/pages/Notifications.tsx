import { useState } from 'react';
import { CheckCheck, Trash2, AlertTriangle, AlertCircle, Info, CheckCircle, BellOff, Wrench } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

type TabType = 'all' | 'unread' | 'maintenance' | 'system';

export default function Notifications() {
    const session = useAuthStore((state) => state.session);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotificationStore();
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // Filter notifications based on tab
    const filteredNotifications = notifications.filter(notif => {
        if (activeTab === 'unread') return !notif.is_read;
        if (activeTab === 'maintenance') return notif.type === 'maintenance';
        if (activeTab === 'system') return notif.type === 'system' || notif.type === 'info';
        return true; // 'all'
    });

    const handleMarkAllAsRead = () => {
        if (session?.user?.id && unreadCount > 0) {
            void markAllAsRead(session.user.id);
        }
    };

    const handleDeleteAll = () => {
        if (session?.user?.id && notifications.length > 0) {
            if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนทั้งหมด?")) {
                void deleteAllNotifications(session.user.id);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">ศูนย์การแจ้งเตือน</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">จัดการและติดตามสถานะรถของคุณ</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-primary-100 dark:border-primary-500/20"
                    >
                        <CheckCheck size={18} />
                        อ่านแล้วทั้งหมด
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        disabled={notifications.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-red-100 dark:border-red-500/20"
                    >
                        <Trash2 size={18} />
                        ลบทั้งหมด
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <nav className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto custom-scrollbar w-fit border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${activeTab === 'all'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'unread'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        ยังไม่ได้อ่าน
                        {unreadCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'unread'
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${activeTab === 'maintenance'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        การบำรุงรักษา
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all ${activeTab === 'system'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        ระบบ
                    </button>
                </nav>
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => {
                        // Determine icon and colors based on type
                        let Icon = Info;
                        let containerBorder = 'border-slate-400';
                        let iconBg = 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400';
                        let unreadDot = 'bg-primary-500';

                        switch (notif.type) {
                            case 'urgent':
                                Icon = AlertTriangle;
                                containerBorder = 'border-red-500 hover:ring-red-500/50';
                                iconBg = 'bg-red-50 dark:bg-red-500/10 text-red-500';
                                unreadDot = 'bg-red-500';
                                break;
                            case 'warning':
                                Icon = AlertCircle;
                                containerBorder = 'border-orange-500 hover:ring-orange-500/50';
                                iconBg = 'bg-orange-50 dark:bg-orange-500/10 text-orange-500';
                                unreadDot = 'bg-orange-500';
                                break;
                            case 'maintenance':
                                Icon = Wrench;
                                containerBorder = 'border-emerald-500 hover:ring-emerald-500/50';
                                iconBg = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500';
                                unreadDot = 'bg-emerald-500';
                                break;
                            case 'system':
                            case 'info':
                            default:
                                Icon = notif.type === 'system' ? CheckCircle : Info;
                                containerBorder = 'border-blue-500 hover:ring-blue-500/50';
                                iconBg = 'bg-blue-50 dark:bg-blue-500/10 text-blue-500';
                                break;
                        }

                        return (
                            <div
                                key={notif.id}
                                onClick={() => { if (!notif.is_read) void markAsRead(notif.id); }}
                                className={`bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 ${containerBorder} shadow-sm flex gap-4 group transition-all cursor-pointer hover:ring-1 ${notif.is_read ? 'opacity-70 bg-slate-50 dark:bg-slate-900/50' : ''}`}
                            >
                                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                        <h3 className={`font-bold text-slate-900 dark:text-white ${!notif.is_read ? '' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {notif.title}
                                        </h3>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: th })}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {notif.message}
                                    </p>

                                    {notif.cars && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit px-2.5 py-1 rounded-md">
                                            <span>{notif.cars.brand} {notif.cars.model}</span>
                                            <span className="text-slate-400">({notif.cars.plate_number})</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                    {/* Unread dot */}
                                    {!notif.is_read && (
                                        <div className={`w-2.5 h-2.5 rounded-full ${unreadDot}`}></div>
                                    )}
                                    {/* Delete button (only shows on hover) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void deleteNotification(notif.id);
                                        }}
                                        className="mt-auto opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                        title="ลบการแจ้งเตือนนี้"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.5s_ease-out]">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <BellOff size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">ไม่มีการแจ้งเตือนใหม่</h3>
                        <p className="text-slate-500 mt-2">เราจะแจ้งให้คุณทราบเมื่อมีข้อมูลสำคัญเกี่ยวกับรถของคุณ</p>
                        {activeTab !== 'all' && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                ดูการแจ้งเตือนทั้งหมด
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
