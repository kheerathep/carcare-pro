import { useEffect, useState } from 'react';
import {
  BatteryCharging,
  CalendarClock,
  CarFront,
  CircleDot,
  ClipboardCheck,
  Disc3,
  Droplets,
  Fuel,
  MoreHorizontal,
  Paintbrush,
  Plus,
  Save,
  Search,
  Settings2,
  Wind,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

type CarOption = {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  image_url?: string | null;
};

type RepairRecord = {
  id: string;
  user_id: string;
  car_id: string;
  title: string;
  description: string | null;
  repair_date: string;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed';
  cars?: CarOption | null;
};

type RepairForm = {
  car_id: string;
  category: string;
  title: string;
  shop_name: string;
  description: string;
  mileage: string;
  cost: string;
  status: 'pending' | 'in_progress' | 'completed';
  next_appointment_date: string;
  next_appointment_mileage: string;
};

type RepairsNavigationState = {
  openCreateModal?: boolean;
  carId?: string;
} | null;

const repairCategories = [
  { id: 'engine', label: 'เครื่องยนต์', icon: Wrench },
  { id: 'brakes', label: 'เบรก', icon: Disc3 },
  { id: 'tires', label: 'ยาง', icon: CircleDot },
  { id: 'oil', label: 'น้ำมัน', icon: Fuel },
  { id: 'battery', label: 'แบตเตอรี่', icon: BatteryCharging },
  { id: 'air', label: 'แอร์', icon: Wind },
  { id: 'body', label: 'ตัวถัง/สี', icon: Paintbrush },
  { id: 'electric', label: 'ระบบไฟฟ้า', icon: Zap },
  { id: 'suspension', label: 'ช่วงล่าง', icon: CarFront },
  { id: 'transmission', label: 'เกียร์', icon: Settings2 },
  { id: 'checkup', label: 'ตรวจเช็ค', icon: ClipboardCheck },
  { id: 'other', label: 'อื่นๆ', icon: MoreHorizontal },
] as const;

const initialFormState: RepairForm = {
  car_id: '',
  category: 'oil',
  title: '',
  shop_name: '',
  description: '',
  mileage: '',
  cost: '',
  status: 'completed',
  next_appointment_date: '',
  next_appointment_mileage: '',
};

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getStatusLabel(status: RepairRecord['status'] | RepairForm['status']) {
  switch (status) {
    case 'completed':
      return 'เสร็จสิ้น';
    case 'in_progress':
      return 'กำลังซ่อม';
    default:
      return 'นัดหมาย';
  }
}

function getStatusClass(status: RepairRecord['status']) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400';
    case 'in_progress':
      return 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400';
    default:
      return 'bg-primary-500/10 text-primary-600 ring-1 ring-inset ring-primary-500/20 dark:text-primary-400';
  }
}

function extractShopName(description?: string | null) {
  if (!description) return 'ไม่ได้ระบุร้าน';
  const shopLine = description
    .split('\n')
    .find((line) => line.toLowerCase().startsWith('ร้าน/อู่:'));
  return shopLine?.replace('ร้าน/อู่:', '').trim() || 'ไม่ได้ระบุร้าน';
}

export default function Repairs() {
  const session = useAuthStore((state) => state.session);
  const location = useLocation();
  const navigate = useNavigate();
  const [cars, setCars] = useState<CarOption[]>([]);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RepairForm>(initialFormState);
  const navigationState = location.state as RepairsNavigationState;

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const loadPage = async () => {
      try {
        setIsLoading(true);

        const [{ data: carsData, error: carsError }, { data: repairsData, error: repairsError }] =
          await Promise.all([
            supabase
              .from('cars')
              .select('id, brand, model, plate_number, image_url')
              .eq('user_id', userId)
              .order('created_at', { ascending: false }),
            supabase
              .from('repairs')
              .select('id, user_id, car_id, title, description, repair_date, cost, status, cars(id, brand, model, plate_number, image_url)')
              .eq('user_id', userId)
              .order('repair_date', { ascending: false }),
          ]);

        if (carsError) throw carsError;
        if (repairsError) throw repairsError;

        const nextCars = (carsData as CarOption[]) || [];
        setCars(nextCars);
        setRepairs((repairsData as RepairRecord[]) || []);
        setForm((current) => ({
          ...current,
          car_id: current.car_id || nextCars[0]?.id || '',
        }));
      } catch (error) {
        console.error('Failed to load repairs page:', error);
        toast.error('โหลดข้อมูลบันทึกการซ่อมไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPage();
  }, [session?.user?.id]);

  const filteredRepairs = repairs.filter((repair) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [repair.title, repair.cars?.brand, repair.cars?.model, repair.cars?.plate_number, repair.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  const totalCost = repairs.reduce((sum, repair) => sum + Number(repair.cost || 0), 0);
  const completedCount = repairs.filter((repair) => repair.status === 'completed').length;
  const pendingCount = repairs.filter((repair) => repair.status !== 'completed').length;

  const resetForm = () => {
    setForm({
      ...initialFormState,
      car_id: cars[0]?.id || '',
    });
  };

  const openCreateModal = () => {
    if (!cars.length) {
      toast.error('เพิ่มรถอย่างน้อย 1 คันก่อนบันทึกการซ่อม');
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  useEffect(() => {
    if (!navigationState?.openCreateModal || !cars.length) return;

    const selectedCarId = cars.some((car) => car.id === navigationState.carId)
      ? navigationState.carId || ''
      : cars[0]?.id || '';

    setForm({
      ...initialFormState,
      car_id: selectedCarId,
    });
    setIsModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [cars, location.pathname, navigationState, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) return;
    if (!form.car_id) {
      toast.error('กรุณาเลือกรถก่อนบันทึก');
      return;
    }
    if (!form.title.trim()) {
      toast.error('กรุณาระบุรายการซ่อม');
      return;
    }

    try {
      setIsSaving(true);

      const selectedCategory = repairCategories.find((category) => category.id === form.category);
      const descriptionLines = [
        selectedCategory ? `หมวดหมู่: ${selectedCategory.label}` : null,
        form.shop_name.trim() ? `ร้าน/อู่: ${form.shop_name.trim()}` : null,
        form.mileage.trim() ? `เลขไมล์: ${form.mileage.trim()} km` : null,
        form.description.trim() ? `รายละเอียด: ${form.description.trim()}` : null,
      ].filter(Boolean);

      const { error: repairError } = await supabase.from('repairs').insert([
        {
          user_id: session.user.id,
          car_id: form.car_id,
          title: form.title.trim(),
          description: descriptionLines.join('\n') || null,
          repair_date: getTodayDate(),
          cost: Number(form.cost) || 0,
          status: form.status,
        },
      ]);

      if (repairError) throw repairError;

      if (form.next_appointment_date) {
        const { error: appointmentError } = await supabase.from('appointments').insert([
          {
            user_id: session.user.id,
            car_id: form.car_id,
            title: `นัดหมายติดตาม: ${form.title.trim()}`,
            appointment_date: form.next_appointment_date,
            location: form.shop_name.trim() || null,
            status: 'scheduled',
          },
        ]);

        if (appointmentError) {
          console.error('Failed to create appointment:', appointmentError);
          toast('บันทึกการซ่อมแล้ว แต่สร้างนัดหมายครั้งถัดไปไม่สำเร็จ');
        }
      }

      const { data: repairsData, error: reloadError } = await supabase
        .from('repairs')
        .select('id, user_id, car_id, title, description, repair_date, cost, status, cars(id, brand, model, plate_number, image_url)')
        .eq('user_id', session.user.id)
        .order('repair_date', { ascending: false });

      if (reloadError) throw reloadError;

      setRepairs((repairsData as RepairRecord[]) || []);
      toast.success('บันทึกการซ่อมเรียบร้อยแล้ว');
      closeModal();
    } catch (error) {
      console.error('Failed to save repair:', error);
      const message = error instanceof Error ? error.message : 'บันทึกการซ่อมไม่สำเร็จ';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary-500/10 via-primary-500/5 to-transparent dark:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              <Wrench size={14} />
              Repair Log
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              บันทึกการซ่อม
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              บันทึกรายการซ่อม ค่าใช้จ่าย และสร้างนัดหมายติดตามครั้งถัดไปได้ในหน้าจอเดียว
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-[280px] max-w-full sm:min-w-[320px]">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ค้นหารายการซ่อม, รถ หรือทะเบียน..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
                type="text"
              />
            </label>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700"
            >
              <Plus size={18} />
              เพิ่มบันทึก
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">รายการซ่อมทั้งหมด</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{repairs.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">เสร็จสิ้นแล้ว</p>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">กำลังติดตาม</p>
          <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ค่าใช้จ่ายรวม</p>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatMoney(totalCost)}</p>
        </div>
      </section>

      <section className="space-y-4">
        {filteredRepairs.length ? (
          filteredRepairs.map((repair) => (
            <article
              key={repair.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-500/30 md:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <Droplets size={24} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{repair.title}</h2>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(repair.status)}`}>
                        {getStatusLabel(repair.status)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {repair.cars?.brand} {repair.cars?.model} • {repair.cars?.plate_number}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{extractShopName(repair.description)}</p>
                    {repair.description && (
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{repair.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-3 md:min-w-[220px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">วันที่</span>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatDate(repair.repair_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">ค่าใช้จ่าย</span>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(repair.cost)}</p>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-800/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <Wrench size={28} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">ยังไม่มีบันทึกการซ่อม</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              เริ่มเก็บประวัติการดูแลรถเพื่อดูค่าใช้จ่ายและติดตามงานซ่อมย้อนหลังได้ง่ายขึ้น
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Plus size={18} />
              เพิ่มบันทึกการซ่อม
            </button>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                  <Plus size={18} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">บันทึกการซ่อมใหม่</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
                <section>
                  <label className="mb-3 block text-sm font-semibold text-slate-400">เลือกรถของคุณ</label>
                  <div className="relative">
                    <select
                      value={form.car_id}
                      onChange={(event) => setForm((current) => ({ ...current, car_id: event.target.value }))}
                      className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    >
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.brand} {car.model} ({car.plate_number})
                        </option>
                      ))}
                    </select>
                    <CarFront size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </section>

                <section>
                  <label className="mb-4 block text-sm font-semibold text-slate-400">หมวดหมู่การซ่อม</label>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                    {repairCategories.map((category) => {
                      const Icon = category.icon;
                      const isActive = form.category === category.id;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, category: category.id }))}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                            isActive
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-primary-500/40 hover:bg-primary-500/5'
                          }`}
                        >
                          <Icon size={18} />
                          <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'} text-inherit`}>
                            {category.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-400">รายการซ่อม</label>
                    <input
                      required
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="เช่น เปลี่ยนน้ำมันเครื่อง"
                      type="text"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-400">ชื่อร้าน/อู่ซ่อม</label>
                    <input
                      value={form.shop_name}
                      onChange={(event) => setForm((current) => ({ ...current, shop_name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="ระบุชื่อศูนย์บริการ"
                      type="text"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-400">รายละเอียด</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-[96px] w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="รายละเอียดการซ่อม..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-400">เลขไมล์ (km)</label>
                    <input
                      value={form.mileage}
                      onChange={(event) => setForm((current) => ({ ...current, mileage: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="0"
                      type="number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-400">ค่าใช้จ่าย (฿)</label>
                    <input
                      value={form.cost}
                      onChange={(event) => setForm((current) => ({ ...current, cost: event.target.value }))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                </section>

                <section>
                  <label className="mb-3 block text-sm font-semibold text-slate-400">สถานะ</label>
                  <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-1">
                    {[
                      { value: 'completed' as const, label: 'เสร็จสิ้น' },
                      { value: 'in_progress' as const, label: 'กำลังซ่อม' },
                      { value: 'pending' as const, label: 'นัดหมาย' },
                    ].map((statusOption) => (
                      <button
                        key={statusOption.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, status: statusOption.value }))}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm transition ${
                          form.status === statusOption.value
                            ? 'bg-primary-600 font-bold text-white shadow-lg shadow-primary-500/20'
                            : 'font-medium text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {statusOption.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-800/30 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <CalendarClock size={16} className="text-primary-400" />
                    การนัดหมายครั้งถัดไป
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-500">วันนัดครั้งถัดไป</label>
                      <input
                        value={form.next_appointment_date}
                        onChange={(event) => setForm((current) => ({ ...current, next_appointment_date: event.target.value }))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        type="date"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-500">ไมล์ครั้งถัดไป (km)</label>
                      <input
                        value={form.next_appointment_mileage}
                        onChange={(event) => setForm((current) => ({ ...current, next_appointment_mileage: event.target.value }))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                        placeholder="กม. ที่ควรนำรถเข้าตรวจ"
                        type="number"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex gap-3 border-t border-slate-800 bg-slate-900/80 px-6 py-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-700 px-6 py-3 font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] rounded-xl bg-primary-600 px-6 py-3 font-bold text-white shadow-[0_0_20px_rgba(19,127,236,0.3)] transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Save size={18} />
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
