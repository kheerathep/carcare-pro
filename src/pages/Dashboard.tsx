import { useEffect, useState } from 'react';
import { CarFront, Wrench, Banknote, Calendar, TrendingUp, History, MapPin, MoreHorizontal, Plus, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { fetchDashboardData } from '../services/api';
import type { Car, Repair, Appointment } from '../types/database';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const session = useAuthStore((state) => state.session);
  const displayName = session?.user?.email?.split('@')[0] || 'ผู้ใช้งาน';

  const [cars, setCars] = useState<Car[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!session?.user?.id) return;
      try {
        setIsLoading(true);
        const data = await fetchDashboardData(session.user.id);
        setCars(data?.cars || []);
        setRepairs(data?.repairs || []);
        setAppointments(data?.appointments || []);
      } catch (error) {
        toast.error('ไม่สามารถดึงข้อมูลได้');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session?.user?.id]);

  const totalCost = repairs.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled');
  const recentRepairs = repairs.slice(0, 5);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">ยินดีต้อนรับกลับ, คุณ {displayName} 👋</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">นี่คือสรุปข้อมูลการดูแลรถยนต์ของคุณในวันนี้</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-95">
          <PlusCircle size={20} /> เพิ่มรายการซ่อมด่วน
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><CarFront size={24} /></div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">ทั้งหมด</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">รถทั้งหมด</p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{cars.length} คัน</h4>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"><Wrench size={24} /></div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1"><TrendingUp size={14} /> อัปเดตล่าสุด</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">ประวัติรายการซ่อม</p>
          <div className="flex items-end gap-2 mt-1">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{repairs.length} ครั้ง</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400"><Banknote size={24} /></div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md">รวมทั้งหมด</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">ค่าใช้จ่ายรวม</p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatMoney(totalCost)}</h4>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg text-violet-600 dark:text-violet-400"><Calendar size={24} /></div>
            {upcomingAppointments.length > 0 && (
              <span className="flex h-3 w-3 relative mt-1 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">นัดหมายเร็วๆ นี้</p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{upcomingAppointments.length} รายการ</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5 text-lg">
              <History size={20} className="text-blue-500 dark:text-blue-400" /> ประวัติการซ่อมล่าสุด
            </h3>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">ดูทั้งหมด</button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4">รถยนต์</th>
                  <th className="px-6 py-4">รายการ</th>
                  <th className="px-6 py-4">วันที่</th>
                  <th className="px-6 py-4 text-right">ค่าใช้จ่าย</th>
                  <th className="px-6 py-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {recentRepairs.length > 0 ? (
                  recentRepairs.map((repair) => (
                    <tr key={repair.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-600"
                          
                        ></div>
                        <div className="flex flex-col">
                          <span>{repair.cars?.brand} {repair.cars?.model}</span>
                          <span className="text-xs text-slate-500">{repair.cars?.plate_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{repair.title}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(repair.repair_date)}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white text-right font-semibold">{formatMoney(repair.cost)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${repair.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                          }`}>
                          {repair.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">ยังไม่มีประวัติการซ่อม</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2.5 text-lg">
              <Calendar size={20} className="text-purple-500 dark:text-purple-400" /> นัดหมาย
            </h3>
            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"><MoreHorizontal size={20} /></button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl hover:border-orange-300 dark:hover:border-orange-500/40 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 dark:bg-orange-500/50"></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded px-2 py-0.5 text-xs font-bold uppercase border border-orange-200 dark:border-orange-500/20">
                        {formatDate(appt.appointment_date)}
                      </span>
                    </div>
                  </div>
                  <div className="pl-2">
                    <h4 className="text-slate-900 dark:text-white font-medium">{appt.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-3">
                      {appt.cars?.brand} {appt.cars?.model} - ทะเบียน {appt.cars?.plate_number}
                    </p>
                    {appt.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin size={14} /> {appt.location}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">ไม่มีนัดหมายเร็วๆ นี้</div>
            )}
            <button className="mt-auto w-full py-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <Plus size={18} /> สร้างนัดหมายใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}