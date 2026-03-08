import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Gauge,
  MapPin,
  Palette,
  ReceiptText,
  Sparkles,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

type CarRecord = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  plate_number: string;
  year: number | null;
  color?: string | null;
  image_url: string | null;
  mileage?: number | null;
  created_at?: string | null;
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
  created_at?: string | null;
};

type AppointmentRecord = {
  id: string;
  user_id: string;
  car_id: string;
  title: string;
  appointment_date: string;
  location: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string | null;
};

type RepairDescription = {
  category: string | null;
  shopName: string | null;
  mileage: string | null;
  detail: string | null;
};

const DEFAULT_CAR_IMAGE =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200';

function formatDate(value?: string | null) {
  if (!value) return 'ยังไม่มีข้อมูล';

  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMileage(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'ยังไม่ระบุ';
  }

  return `${new Intl.NumberFormat('th-TH').format(value)} กม.`;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function extractNoteValue(description: string | null | undefined, label: string) {
  if (!description) return null;

  const line = description
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.startsWith(label));

  return line?.slice(label.length).trim() || null;
}

function parseRepairDescription(description: string | null): RepairDescription {
  return {
    category: extractNoteValue(description, 'หมวดหมู่:'),
    shopName: extractNoteValue(description, 'ร้าน/อู่:'),
    mileage: extractNoteValue(description, 'เลขไมล์:'),
    detail: extractNoteValue(description, 'รายละเอียด:'),
  };
}

function getVehicleStatus(mileage?: number | null) {
  if (typeof mileage !== 'number' || Number.isNaN(mileage) || mileage <= 0) {
    return {
      label: 'รอข้อมูลการใช้งาน',
      description: 'เพิ่มเลขไมล์ล่าสุดเพื่อให้ระบบช่วยติดตามรอบดูแลได้แม่นยำขึ้น',
      badgeClass:
        'bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-900',
      panelClass:
        'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white',
      icon: Sparkles,
    };
  }

  if (mileage >= 80000) {
    return {
      label: 'ควรตรวจเช็กระยะ',
      description: 'เลขไมล์อยู่ในช่วงที่ควรเช็กเบรก ช่วงล่าง น้ำมันเครื่อง และของเหลวสำคัญ',
      badgeClass:
        'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400',
      panelClass:
        'border-amber-200 bg-amber-50/80 text-slate-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-white',
      icon: AlertTriangle,
    };
  }

  return {
    label: 'สถานะปกติ',
    description: 'ภาพรวมพร้อมใช้งานและเหมาะกับการบันทึกประวัติดูแลอย่างต่อเนื่อง',
    badgeClass:
      'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400',
    panelClass:
      'border-emerald-200 bg-emerald-50/80 text-slate-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-white',
    icon: CheckCircle2,
  };
}

function getRepairStatusMeta(status: RepairRecord['status']) {
  switch (status) {
    case 'completed':
      return {
        label: 'เสร็จสิ้น',
        className:
          'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400',
        icon: CheckCircle2,
      };
    case 'in_progress':
      return {
        label: 'กำลังซ่อม',
        className:
          'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400',
        icon: Wrench,
      };
    default:
      return {
        label: 'นัดหมาย',
        className:
          'bg-primary-500/10 text-primary-600 ring-1 ring-inset ring-primary-500/20 dark:text-primary-400',
        icon: CalendarClock,
      };
  }
}

function getAppointmentStatusMeta(status: AppointmentRecord['status']) {
  switch (status) {
    case 'completed':
      return {
        label: 'เสร็จแล้ว',
        className:
          'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400',
      };
    case 'cancelled':
      return {
        label: 'ยกเลิก',
        className:
          'bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20 dark:text-rose-400',
      };
    default:
      return {
        label: 'วางแผนไว้',
        className:
          'bg-primary-500/10 text-primary-600 ring-1 ring-inset ring-primary-500/20 dark:text-primary-400',
      };
  }
}

export default function CarDetails() {
  const session = useAuthStore((state) => state.session);
  const navigate = useNavigate();
  const { carId } = useParams();

  const [car, setCar] = useState<CarRecord | null>(null);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId || !carId) {
      setIsLoading(false);
      return;
    }

    const loadCarDetails = async () => {
      try {
        setIsLoading(true);

        const [
          { data: carData, error: carError },
          { data: repairData, error: repairError },
          { data: appointmentData, error: appointmentError },
        ] = await Promise.all([
          supabase
            .from('cars')
            .select('id, user_id, brand, model, plate_number, year, color, image_url, mileage, created_at')
            .eq('user_id', userId)
            .eq('id', carId)
            .maybeSingle(),
          supabase
            .from('repairs')
            .select('id, user_id, car_id, title, description, repair_date, cost, status, created_at')
            .eq('user_id', userId)
            .eq('car_id', carId)
            .order('repair_date', { ascending: false }),
          supabase
            .from('appointments')
            .select('id, user_id, car_id, title, appointment_date, location, status, created_at')
            .eq('user_id', userId)
            .eq('car_id', carId)
            .order('appointment_date', { ascending: true }),
        ]);

        if (carError) throw carError;
        if (repairError) throw repairError;
        if (appointmentError) throw appointmentError;

        setCar((carData as CarRecord | null) || null);
        setRepairs((repairData as RepairRecord[]) || []);
        setAppointments((appointmentData as AppointmentRecord[]) || []);
      } catch (error) {
        console.error('Failed to load car details:', error);
        toast.error('โหลดรายละเอียดรถไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCarDetails();
  }, [carId, session?.user?.id]);

  const totalRepairCost = repairs.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const completedRepairs = repairs.filter((item) => item.status === 'completed').length;
  const scheduledAppointments = appointments.filter((item) => item.status === 'scheduled');
  const nextAppointment = scheduledAppointments[0] || null;
  const lastRepair = repairs[0] || null;
  const averageRepairCost = repairs.length ? totalRepairCost / repairs.length : 0;
  const status = getVehicleStatus(car?.mileage);
  const StatusIcon = status.icon;
  const careSuggestions = [
    nextAppointment
      ? `มีนัดหมาย "${nextAppointment.title}" วันที่ ${formatDate(nextAppointment.appointment_date)}`
      : 'ยังไม่มีนัดหมายครั้งถัดไป สามารถสร้างเพิ่มได้จากหน้าแดชบอร์ด',
    car?.mileage && car.mileage >= 80000
      ? 'แนะนำให้เช็กระบบเบรก ช่วงล่าง ยาง และของเหลวหลักในรอบถัดไป'
      : 'ติดตามการเปลี่ยนน้ำมันเครื่องและตรวจของเหลวตามรอบการใช้งาน',
    repairs.length
      ? `มีประวัติซ่อม ${repairs.length} ครั้ง ค่าใช้จ่ายเฉลี่ย ${formatMoney(averageRepairCost)} ต่อครั้ง`
      : 'เริ่มบันทึกการดูแลคันนี้เพื่อให้ระบบช่วยตามค่าใช้จ่ายและประวัติย้อนหลังได้',
  ];

  const handleOpenRepairForm = () => {
    if (!car) return;

    navigate('/repairs', {
      state: {
        openCreateModal: true,
        carId: car.id,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!car) {
    return (
      <section className="mx-auto max-w-4xl rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          <CarFront size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          ไม่พบข้อมูลรถคันนี้
        </h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          รายการอาจถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลของรถคันนี้
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-cars')}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <ArrowLeft size={18} />
          กลับไปหน้ารถของฉัน
        </button>
      </section>
    );
  }

  const heroSection = (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.08),_transparent_32%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.22),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.3),_transparent_35%)]" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/my-cars')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 backdrop-blur transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-primary-500/50 dark:hover:text-primary-300"
        >
          <ArrowLeft size={18} />
          กลับไปหน้ารถของฉัน
        </button>

        <button
          type="button"
          onClick={handleOpenRepairForm}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700"
        >
          <Wrench size={18} />
          บันทึกซ่อมคันนี้
        </button>
      </div>

      <div className="relative mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-inner dark:border-slate-700 dark:bg-slate-900">
            <img
              alt={`${car.brand} ${car.model}`}
              className="h-full min-h-[320px] w-full object-cover"
              src={car.image_url || DEFAULT_CAR_IMAGE}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-900 backdrop-blur dark:bg-slate-950/70 dark:text-white">
              <CarFront size={14} />
              Vehicle Profile
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
              <div className="rounded-2xl bg-slate-950/70 px-4 py-3 text-white backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
                  ทะเบียนรถ
                </p>
                <p className="mt-1 text-xl font-black tracking-[0.08em]">
                  {car.plate_number}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${status.badgeClass}`}
              >
                <StatusIcon size={16} />
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                <Sparkles size={14} />
                Car Detail
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
                {car.brand} {car.model}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                หน้าโปรไฟล์ของรถคันนี้รวมภาพรวมการใช้งาน ประวัติการซ่อม และนัดหมายที่เกี่ยวข้องไว้ในที่เดียว
                เพื่อให้ติดตามการดูแลรถได้ต่อเนื่องและเห็นบริบทของแต่ละคันชัดขึ้น
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  รุ่นปี
                </span>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {car.year || 'ยังไม่ระบุ'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  สีรถ
                </span>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {car.color || 'ยังไม่ระบุ'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  เลขไมล์ล่าสุด
                </span>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {formatMileage(car.mileage)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  เพิ่มเข้าระบบ
                </span>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {formatDate(car.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={`rounded-[28px] border p-6 shadow-sm ${status.panelClass}`}>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/80 p-3 text-slate-900 shadow-sm dark:bg-slate-900/40 dark:text-white">
                <StatusIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300/80">
                  Vehicle Status
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {status.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {status.description}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  เช็กระยะล่าสุด
                </p>
                <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {lastRepair ? formatDate(lastRepair.repair_date) : 'ยังไม่มีประวัติ'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  นัดหมายถัดไป
                </p>
                <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                  {nextAppointment ? formatDate(nextAppointment.appointment_date) : 'ยังไม่ได้วางแผน'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <Wrench size={22} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  ทั้งหมด
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                ประวัติการซ่อม
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {repairs.length}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 size={22} />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  เสร็จแล้ว
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                งานที่ปิดแล้ว
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {completedRepairs}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <ReceiptText size={22} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  ค่าใช้จ่ายสะสม
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                รวมตั้งแต่เริ่มบันทึก
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {formatMoney(totalRepairCost)}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <CalendarClock size={22} />
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  วางแผนไว้
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                นัดหมายครั้งถัดไป
              </p>
              <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                {nextAppointment ? formatDate(nextAppointment.appointment_date) : 'ยังไม่มี'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const timelineSection = (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
            <Wrench size={14} />
            Service Timeline
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            ไทม์ไลน์การดูแลรถ
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            ดูรายการซ่อมล่าสุดของรถคันนี้ พร้อมสถานะ ค่าใช้จ่าย และบันทึกจากอู่หรือศูนย์บริการ
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenRepairForm}
          className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-500/50 dark:hover:text-primary-300 md:inline-flex"
        >
          <Wrench size={16} />
          เพิ่มรายการ
        </button>
      </div>

      {repairs.length ? (
        <div className="mt-8 space-y-4">
          {repairs.map((repair) => {
            const meta = getRepairStatusMeta(repair.status);
            const parsedDescription = parseRepairDescription(repair.description);
            const RepairIcon = meta.icon;

            return (
              <article
                key={repair.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 transition hover:border-primary-200 dark:border-slate-700 dark:bg-slate-900/45 dark:hover:border-primary-500/30 md:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
                      <RepairIcon size={20} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {repair.title}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                          <CalendarClock size={14} />
                          {formatDate(repair.repair_date)}
                        </span>
                        {parsedDescription.category ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            <Sparkles size={14} />
                            {parsedDescription.category}
                          </span>
                        ) : null}
                        {parsedDescription.mileage ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            <Gauge size={14} />
                            {parsedDescription.mileage}
                          </span>
                        ) : null}
                      </div>

                      {parsedDescription.shopName ? (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          อู่/ศูนย์บริการ: {parsedDescription.shopName}
                        </p>
                      ) : null}

                      {parsedDescription.detail ? (
                        <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {parsedDescription.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:min-w-[200px]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      ค่าใช้จ่าย
                    </p>
                    <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                      {formatMoney(repair.cost)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/35">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <Wrench size={24} />
          </div>
          <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            ยังไม่มีประวัติการซ่อมของรถคันนี้
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            เริ่มบันทึกรายการดูแลครั้งแรกเพื่อให้หน้า detail นี้แสดงภาพรวมการใช้งานได้ครบขึ้น
          </p>
        </div>
      )}
    </div>
  );

  const sidebarSection = (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          <CalendarClock size={14} />
          Appointments
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          นัดหมายและแผนถัดไป
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          ใช้ส่วนนี้เพื่อติดตามรอบดูแลที่วางไว้แล้วสำหรับรถคันนี้
        </p>

        {appointments.length ? (
          <div className="mt-6 space-y-4">
            {appointments.map((appointment) => {
              const meta = getAppointmentStatusMeta(appointment.status);

              return (
                <article
                  key={appointment.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {appointment.title}
                      </h3>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <CalendarClock size={14} />
                        {formatDate(appointment.appointment_date)}
                      </p>
                      {appointment.location ? (
                        <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <MapPin size={14} />
                          {appointment.location}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-6 dark:border-slate-700 dark:bg-slate-900/35">
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              ยังไม่มีนัดหมายสำหรับรถคันนี้ หากต้องการวางแผนเข้าศูนย์หรือเช็กระยะครั้งถัดไป
              สามารถสร้างนัดหมายเพิ่มจากหน้าแดชบอร์ดได้
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <CalendarClock size={18} />
              ไปที่แดชบอร์ด
            </button>
          </div>
        )}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
          <Sparkles size={14} />
          Insights
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          แนวทางดูแลต่อไป
        </h2>
        <div className="mt-6 space-y-4">
          {careSuggestions.map((item, index) => (
            <div
              key={item}
              className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700">
                0{index + 1}
              </div>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-slate-600 dark:bg-slate-700/70 dark:text-slate-300">
          <CarFront size={14} />
          Snapshot
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          ข้อมูลตัวรถแบบย่อ
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              ยี่ห้อและรุ่น
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {car.brand} {car.model}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              ทะเบียน
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {car.plate_number}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Gauge size={14} />
                เลขไมล์
              </span>
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {formatMileage(car.mileage)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Palette size={14} />
                สีรถ
              </span>
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {car.color || 'ยังไม่ระบุ'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              ค่าใช้จ่ายเฉลี่ยต่อครั้ง
            </p>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {repairs.length ? formatMoney(averageRepairCost) : 'ยังไม่มีข้อมูลเพียงพอ'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {heroSection}
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {timelineSection}
        {sidebarSection}
      </section>
    </div>
  );
}
