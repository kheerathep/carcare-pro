import { useState, useMemo, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO,
    isBefore,
    startOfDay,
} from 'date-fns';
import { th } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    MapPin,
    X,
    Save,
    Trash2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import type { Appointment, Car } from '../types/database';
import toast from 'react-hot-toast';

type AppointmentWithCar = Appointment & { cars?: Car | null };

// --- Helpers ---
function getAppointmentBadgeColor(status: Appointment['status']) {
    switch (status) {
        case 'completed':
            return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10';
        case 'cancelled':
            return 'bg-rose-500/20 text-rose-700 border-rose-500/30 dark:text-rose-400 dark:bg-rose-500/10';
        case 'scheduled':
        default:
            return 'bg-primary-500/20 text-primary-700 border-primary-500/30 dark:text-primary-400 dark:bg-primary-500/10';
    }
}

export default function Appointments() {
    const session = useAuthStore((state) => state.session);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<AppointmentWithCar[]>([]);
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteApptId, setDeleteApptId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        car_id: '',
        title: '',
        appointment_date: format(new Date(), 'yyyy-MM-dd'),
        appointment_time: '09:00',
        location: '',
        status: 'scheduled' as Appointment['status'],
    });

    // --- Data Fetching ---
    const loadData = async () => {
        if (!session?.user?.id) return;
        try {
            setIsLoading(true);
            const [carsRes, apptsRes] = await Promise.all([
                supabase.from('cars').select('*').eq('user_id', session.user.id),
                supabase
                    .from('appointments')
                    .select('*, cars(*)')
                    .eq('user_id', session.user.id)
                    .order('appointment_date', { ascending: true }),
            ]);

            if (carsRes.error) throw carsRes.error;
            if (apptsRes.error) throw apptsRes.error;

            const userCars = (carsRes.data as Car[]) || [];
            setCars(userCars);
            setAppointments((apptsRes.data as AppointmentWithCar[]) || []);

            if (userCars.length > 0 && !form.car_id) {
                setForm((prev) => ({ ...prev, car_id: userCars[0].id }));
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            toast.error('ไม่สามารถโหลดข้อมูลนัดหมายได้');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [session?.user?.id]);

    // --- Calendar Logic ---
    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = 'd';
    const calendarDays = [];
    let day = startDate;

    while (day <= endDate) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }

    // Derived Data
    const upcomingAppointments = useMemo(() => {
        const today = startOfDay(new Date());
        return appointments.filter(
            (app) => app.status === 'scheduled' && !isBefore(parseISO(app.appointment_date), today),
        );
    }, [appointments]);

    const appointmentsByDate = useMemo(() => {
        const map = new Map<string, AppointmentWithCar[]>();
        appointments.forEach((app) => {
            // Assuming appointment_date is "YYYY-MM-DD" or similar ISO prefix
            const dateKey = app.appointment_date.split('T')[0];
            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, app]);
        });
        return map;
    }, [appointments]);

    // --- Actions ---
    const handleOpenModal = () => {
        if (cars.length === 0) {
            toast.error('กรุณาเพิ่มรถยนต์ก่อนสร้างนัดหมาย');
            return;
        }
        setModalMode('create');
        setEditId(null);
        setForm({
            car_id: cars[0]?.id || '',
            title: '',
            appointment_date: format(new Date(), 'yyyy-MM-dd'),
            appointment_time: '09:00',
            location: '',
            status: 'scheduled',
        });
        setIsModalOpen(true);
    };

    const handleEditModal = (app: AppointmentWithCar) => {
        setModalMode('edit');
        setEditId(app.id);
        const dateStr = app.appointment_date || '';
        const [date, timePart] = dateStr.includes('T') ? dateStr.split('T') : [dateStr.split(' ')[0], '09:00:00'];
        setForm({
            car_id: app.car_id,
            title: app.title,
            appointment_date: date,
            appointment_time: timePart ? timePart.substring(0, 5) : '09:00',
            location: app.location || '',
            status: app.status,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id) return;
        if (!form.car_id || !form.title || !form.appointment_date) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            setIsSaving(true);
            // Combine date and time for insertion if needed, or just save date.
            // Assuming the DB schema has appointment_date as string or timestamp. 
            // Current DB defines it as string.
            const formattedDate = `${form.appointment_date}T${form.appointment_time}:00`;

            if (modalMode === 'edit' && editId) {
                const { error } = await supabase.from('appointments').update({
                    car_id: form.car_id,
                    title: form.title,
                    appointment_date: formattedDate,
                    location: form.location,
                    status: form.status,
                }).eq('id', editId);
                if (error) throw error;
                toast.success('อัปเดตข้อมูลเรียบร้อย');
            } else {
                const { error } = await supabase.from('appointments').insert({
                    user_id: session.user.id,
                    car_id: form.car_id,
                    title: form.title,
                    appointment_date: formattedDate,
                    location: form.location,
                    status: form.status,
                });
                if (error) throw error;
                toast.success('บันทึกนัดหมายเรียบร้อย');
            }

            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('Error saving appointment:', error);
            toast.error('ไม่สามารถบันทึกนัดหมายได้');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteAppointment = async () => {
        if (!deleteApptId) return;
        try {
            setIsLoading(true);
            const { error } = await supabase.from('appointments').delete().eq('id', deleteApptId);
            if (error) throw error;

            toast.success('ลบรายการนัดหมายเรียบร้อย');
            setDeleteApptId(null);
            loadData();
        } catch (error) {
            console.error('Error deleting appointment:', error);
            toast.error('ไม่สามารถลบรายการได้');
        } finally {
            setIsLoading(false);
        }
    };

    const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden">
            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 bg-white/50 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            ตารางนัดหมายประจำเดือน
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {format(currentDate, 'MMMM yyyy', { locale: th })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevMonth}
                                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-3 py-1 text-sm font-bold text-slate-700 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                            >
                                วันนี้
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">เพิ่มนัดหมายใหม่</span>
                        </button>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="flex flex-1 overflow-hidden bg-slate-50/50 dark:bg-[#101922]">
                    {/* Calendar Section */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                {/* Days of Week Header */}
                                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                                    {WEEK_DAYS.map((day) => (
                                        <div
                                            key={day}
                                            className="py-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Body */}
                                <div className="grid flex-1 grid-cols-7 grid-rows-5 lg:grid-rows-6">
                                    {calendarDays.map((date, idx) => {
                                        const isCurrentMonth = isSameMonth(date, monthStart);
                                        const isToday = isSameDay(date, new Date());
                                        const dateKey = format(date, 'yyyy-MM-dd');
                                        const dayAppointments = appointmentsByDate.get(dateKey) || [];

                                        return (
                                            <div
                                                key={idx}
                                                className={`min-h-[100px] border-b border-r border-slate-200 p-2 transition-colors dark:border-slate-800 lg:min-h-[120px] ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-800/20 opacity-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                                    } ${isToday ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''}`}
                                            >
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span
                                                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday
                                                            ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                                                            : 'text-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {format(date, dateFormat)}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px] lg:max-h-[85px] custom-scrollbar pr-1">
                                                    {dayAppointments.map((app) => (
                                                        <div
                                                            key={app.id}
                                                            title={app.title}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditModal(app);
                                                            }}
                                                            className={`cursor-pointer truncate rounded border px-1.5 py-0.5 text-[10px] font-medium leading-tight sm:px-2 sm:py-1 sm:text-xs group relative flex items-center justify-between gap-1 ${getAppointmentBadgeColor(
                                                                app.status
                                                            )}`}
                                                        >
                                                            <span className="truncate flex-1">
                                                                {app.cars?.plate_number} - {app.title}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteApptId(app.id);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                                                                title="ลบรายการ"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Status Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 sm:mt-6">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
                                    รอนัดหมาย (Scheduled)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
                                    เสร็จสิ้น (Completed)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
                                    ยกเลิก (Cancelled)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Upcoming Appointments */}
                    <aside className="hidden w-80 flex-col overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:flex custom-scrollbar">
                        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                            <CalendarIcon className="text-primary-500" size={20} />
                            นัดหมายที่จะถึง
                        </h3>

                        <div className="flex flex-col gap-4">
                            {upcomingAppointments.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">ไม่มีนัดหมายเร็วๆ นี้</p>
                                </div>
                            ) : (
                                upcomingAppointments.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => handleEditModal(app)}
                                        className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-primary-500/50"
                                    >
                                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary-500"></div>
                                        <div className="mb-2 flex items-start justify-between">
                                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                                                {format(parseISO(app.appointment_date), 'd MMM • HH:mm', { locale: th })}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteApptId(app.id);
                                                }}
                                                className="text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg p-1.5 shadow-sm border border-slate-200 dark:border-slate-700"
                                                title="ลบนัดหมาย"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            {app.cars?.brand} {app.cars?.model} ({app.cars?.plate_number})
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            รายการ: {app.title}
                                        </p>
                                        {app.location && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span className="truncate">{app.location}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        {appointments.length > 5 && (
                            <button className="mt-auto rounded-xl border border-primary-200 bg-primary-50 py-3 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-100 dark:border-primary-500/20 dark:bg-primary-500/5 dark:text-primary-400 dark:hover:bg-primary-500/10">
                                ดูทั้งหมด ({appointments.length} รายการ)
                            </button>
                        )}
                    </aside>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {modalMode === 'edit' ? 'แก้ไขรายการนัดหมาย' : 'เพิ่มนัดหมายใหม่'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        เลือกรถยนต์
                                    </span>
                                    <select
                                        value={form.car_id}
                                        onChange={(e) => setForm({ ...form, car_id: e.target.value })}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        {cars.map((car) => (
                                            <option key={car.id} value={car.id}>
                                                {car.brand} {car.model} ({car.plate_number})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        รายการนัดหมาย
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="เช่น เช็คระยะ 50k, เปลี่ยนยาง 4 เส้น"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            วันที่
                                        </span>
                                        <input
                                            type="date"
                                            required
                                            value={form.appointment_date}
                                            onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            เวลา
                                        </span>
                                        <input
                                            type="time"
                                            required
                                            value={form.appointment_time}
                                            onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            สถานที่
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="เช่น ศูนย์แจ้งวัฒนะ"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            สถานะ
                                        </span>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as Appointment['status'] })}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        >
                                            <option value="scheduled">รอนัดหมาย (Scheduled)</option>
                                            <option value="completed">เสร็จสิ้น (Completed)</option>
                                            <option value="cancelled">ยกเลิก (Cancelled)</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 disabled:opacity-70"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteApptId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">ยืนยันการลบ</h3>
                        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                            คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายนี้? ข้อมูลจะไม่สามารถกู้คืนได้
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteApptId(null)}
                                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDeleteAppointment}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-700 active:scale-95"
                            >
                                ลบข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
