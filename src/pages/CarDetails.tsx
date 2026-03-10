import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Droplets,
  FileText,
  Fuel,
  GalleryVerticalEnd,
  Gauge,
  MapPin,
  Palette,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Wrench,
  X,
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
  tax_expiry_date?: string | null;
  insurance_expiry_date?: string | null;
  insurance_company?: string | null;
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

type FuelLogRecord = {
  id: string;
  car_id: string;
  user_id: string;
  log_date: string;
  mileage: number;
  volume_liters: number;
  total_cost: number;
  created_at: string;
};

type DocumentRecord = {
  id: string;
  car_id: string;
  user_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  created_at: string;
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
        label: 'รอดำเนินการ',
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
  const [fuelLogs, setFuelLogs] = useState<FuelLogRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'repairs' | 'fuel' | 'glovebox'>('repairs');

  // Document Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('other');

  // Fuel Log Modal State
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isSavingFuel, setIsSavingFuel] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    mileage: '',
    volume_liters: '',
    total_cost: ''
  });

  // Tax & Insurance Modal State
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [taxForm, setTaxForm] = useState({
    tax_expiry_date: '',
    insurance_expiry_date: '',
    insurance_company: '',
  });

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
          { data: fuelData, error: fuelError },
          { data: docData, error: docError },
        ] = await Promise.all([
          supabase
            .from('cars')
            .select('id, user_id, brand, model, plate_number, year, color, image_url, mileage, tax_expiry_date, insurance_expiry_date, insurance_company, created_at')
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
          supabase
            .from('fuel_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('car_id', carId)
            .order('log_date', { ascending: false }),
          supabase
            .from('car_documents')
            .select('*')
            .eq('user_id', userId)
            .eq('car_id', carId)
            .order('created_at', { ascending: false }),
        ]);

        if (carError) throw carError;
        if (repairError) throw repairError;
        if (appointmentError) throw appointmentError;
        if (fuelError) throw fuelError;
        if (docError) throw docError;

        setCar((carData as CarRecord | null) || null);
        setRepairs((repairData as RepairRecord[]) || []);
        setAppointments((appointmentData as AppointmentRecord[]) || []);
        setFuelLogs((fuelData as FuelLogRecord[]) || []);
        setDocuments((docData as DocumentRecord[]) || []);
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

  const openFuelModal = () => {
    setFuelForm({
      log_date: new Date().toISOString().split('T')[0],
      mileage: car?.mileage ? String(car.mileage) : '',
      volume_liters: '',
      total_cost: ''
    });
    setIsFuelModalOpen(true);
  };

  const handleCreateFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !session?.user?.id) return;
    try {
      setIsSavingFuel(true);

      const payload = {
        car_id: car.id,
        user_id: session.user.id,
        log_date: new Date(fuelForm.log_date).toISOString(),
        mileage: Number(fuelForm.mileage) || 0,
        volume_liters: Number(fuelForm.volume_liters) || 0,
        total_cost: Number(fuelForm.total_cost) || 0,
      };

      const { data, error } = await supabase
        .from('fuel_logs')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setFuelLogs(prev => [data as FuelLogRecord, ...prev].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()));

      // Update car mileage if new fuel log has higher mileage
      if (payload.mileage > (car.mileage || 0)) {
        await supabase.from('cars').update({ mileage: payload.mileage }).eq('id', car.id);
        setCar({ ...car, mileage: payload.mileage });
      }

      toast.success('บันทึกค่าน้ำมันเรียบร้อยแล้ว');
      setIsFuelModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถบันทึกค่าน้ำมันได้');
    } finally {
      setIsSavingFuel(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !session?.user?.id || !docFile) return;

    try {
      setIsUploadingDoc(true);
      const fileExt = docFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${car.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('car-documents')
        .upload(filePath, docFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('car-documents')
        .getPublicUrl(filePath);

      const payload = {
        car_id: car.id,
        user_id: session.user.id,
        document_name: docName || docFile.name,
        document_type: docType,
        file_url: publicUrl,
      };

      const { data, error: insertError } = await supabase
        .from('car_documents')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setDocuments(prev => [data as DocumentRecord, ...prev]);
      toast.success('อัปโหลดเอกสารเรียบร้อย');
      setIsDocModalOpen(false);
      setDocFile(null);
      setDocName('');
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถอัปโหลดเอกสารได้');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const openTaxModal = () => {
    if (!car) return;
    setTaxForm({
      tax_expiry_date: car.tax_expiry_date || '',
      insurance_expiry_date: car.insurance_expiry_date || '',
      insurance_company: car.insurance_company || '',
    });
    setIsTaxModalOpen(true);
  };

  const handleUpdateTaxInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !session?.user?.id) return;

    try {
      setIsSavingTax(true);
      const payload = {
        tax_expiry_date: taxForm.tax_expiry_date || null,
        insurance_expiry_date: taxForm.insurance_expiry_date || null,
        insurance_company: taxForm.insurance_company || null,
      };

      const { error } = await supabase
        .from('cars')
        .update(payload)
        .eq('id', car.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setCar({ ...car, ...payload });
      toast.success('อัปเดตข้อมูลภาษีและประกันเรียบร้อย');
      setIsTaxModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSavingTax(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl dark:bg-slate-900 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('repairs')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'repairs' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Wrench size={16} /> ประวัติการซ่อม
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'fuel' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Fuel size={16} /> บันทึกน้ำมัน
          </button>
        </div>

        {activeTab === 'repairs' ? (
          <button
            type="button"
            onClick={handleOpenRepairForm}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary-500/50 dark:hover:text-primary-300 w-full sm:w-auto"
          >
            <Wrench size={16} />
            เพิ่มรายการซ่อม
          </button>
        ) : (
          <button
            type="button"
            onClick={openFuelModal}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:text-blue-300 w-full sm:w-auto"
          >
            <Droplets size={16} />
            บันทึกเติมน้ำมัน
          </button>
        )}
      </div>

      {activeTab === 'repairs' ? (
        // Repairs Timeline
        repairs.length ? (
          <div className="mt-8 space-y-4 animate-[fadeIn_0.5s_ease-out]">
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
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/35 animate-[fadeIn_0.5s_ease-out]">
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
        )
      ) : activeTab === 'fuel' ? (
        // Fuel Log Timeline
        fuelLogs.length ? (
          <div className="mt-8 space-y-4 animate-[fadeIn_0.5s_ease-out]">
            {fuelLogs.map((log) => {
              // Wait, km/L calculation requires delta mileage. 
              // So maybe just Cost/Liter instead for a simple display
              const costPerLiter = log.volume_liters ? log.total_cost / log.volume_liters : 0;

              return (
                <article
                  key={log.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 transition hover:border-blue-200 dark:border-slate-700 dark:bg-slate-900/45 dark:hover:border-blue-500/30 md:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700">
                        <Fuel size={20} />
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            เติมน้ำมัน
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
                            {log.volume_liters} ลิตร
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            <CalendarClock size={14} />
                            {formatDate(log.log_date)}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                            <Gauge size={14} />
                            {formatMileage(log.mileage)}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          เฉลี่ย {costPerLiter.toFixed(2)} บาท/ลิตร
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 lg:min-w-[200px]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        ยอดชำระ
                      </p>
                      <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                        {formatMoney(log.total_cost)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/35 animate-[fadeIn_0.5s_ease-out]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Fuel size={24} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              ยังไม่มีบันทึกค่าน้ำมัน
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              เริ่มบันทึกข้อมูลการเติมน้ำมันเพื่อให้ระบบวิเคราะห์อัตราสิ้นเปลืองให้คุณ
            </p>
          </div>
        )
      ) : (
        // Glovebox Timeline
        documents.length ? (
          <div className="mt-8 space-y-4 animate-[fadeIn_0.5s_ease-out]">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/80"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                      {doc.document_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      {doc.document_type} • {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  เปิดดู
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/35 animate-[fadeIn_0.5s_ease-out]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <GalleryVerticalEnd size={24} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              เก็บเอกสารประจำรถ
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              อัปโหลดกรมธรรม์, ทะเบียนรถ, รูปถ่ายใบเสร็จต่างๆ ไว้ที่นี่
            </p>
          </div>
        )
      )}
    </div>
  );

  const sidebarSection = (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <ShieldCheck size={14} />
            Tax & Insurance
          </div>
          <button
            onClick={openTaxModal}
            className="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 dark:text-primary-400 p-1.5 rounded-xl transition-colors"
          >
            <Wrench size={16} />
          </button>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
          ภาษีและประกันภัย
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                <ReceiptText size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">วันต่อภาษี</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {car.tax_expiry_date ? formatDate(car.tax_expiry_date) : 'ยังไม่ระบุ'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
                <ShieldAlert size={20} className="text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">ประกัน {car.insurance_company ? `(${car.insurance_company})` : ''}</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {car.insurance_expiry_date ? formatDate(car.insurance_expiry_date) : 'ยังไม่ระบุ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Droplets size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">บันทึกค่าน้ำมัน</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ช่วยคำนวณอัตราสิ้นเปลืองและค่าใช้จ่ายต่อเดือน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFuelModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFuelLog}>
              <div className="space-y-5 p-6 md:p-8">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">วันที่เติมน้ำมัน</span>
                  <input
                    type="date"
                    required
                    value={fuelForm.log_date}
                    onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ยอดชำระ (บาท)</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={fuelForm.total_cost}
                      onChange={(e) => setFuelForm({ ...fuelForm, total_cost: e.target.value })}
                      placeholder="เช่น 1500"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ปริมาณ (ลิตร)</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={fuelForm.volume_liters}
                      onChange={(e) => setFuelForm({ ...fuelForm, volume_liters: e.target.value })}
                      placeholder="เช่น 40.5"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">เลขไมล์รถหน้าปัด (กม.)</span>
                  <input
                    type="number"
                    required
                    value={fuelForm.mileage}
                    onChange={(e) => setFuelForm({ ...fuelForm, mileage: e.target.value })}
                    placeholder="เช่น 51000"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">ใช้เพื่อเก็บสถิติระยะทางวิ่ง</p>
                </label>
              </div>
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row dark:border-slate-800 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingFuel}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingFuel ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">อัปโหลดเอกสาร</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ไฟล์ไม่เกิน 5MB (PDF/JPG/PNG)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUploadDocument}>
              <div className="space-y-5 p-6 md:p-8">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">เลือกไฟล์</span>
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="h-12 w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-500/10 dark:file:text-primary-400 file:transition text-slate-900 dark:text-slate-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ชื่อเอกสาร</span>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="เช่น กรมธรรม์ปี 2567, ใบเสร็จแบตเตอรี่"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">หากไม่กรอก ระบบจะใช้ชื่อไฟล์แทน</p>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">ประเภท</span>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="insurance">กรมธรรม์ประกันภัย</option>
                    <option value="registration">สมุดจดทะเบียน (เล่มฟ้า/สำเนา)</option>
                    <option value="receipt">ใบเสร็จ/ใบกำกับภาษี</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row dark:border-slate-800 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc || !docFile}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {isUploadingDoc ? 'กำลังอัปโหลด...' : 'บันทึกเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">จัดการข้อมูลภาษีและประกัน</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsTaxModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateTaxInsurance}>
              <div className="space-y-5 p-6 md:p-8">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">วันครบกำหนดต่อภาษีรถยนต์</span>
                  <input
                    type="date"
                    value={taxForm.tax_expiry_date}
                    onChange={(e) => setTaxForm({ ...taxForm, tax_expiry_date: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">บริษัทประกันภัย</span>
                  <input
                    type="text"
                    value={taxForm.insurance_company}
                    onChange={(e) => setTaxForm({ ...taxForm, insurance_company: e.target.value })}
                    placeholder="เช่น วิริยะ, กรุงเทพประกันภัย"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">วันหมดอายุประกันภัย</span>
                  <input
                    type="date"
                    value={taxForm.insurance_expiry_date}
                    onChange={(e) => setTaxForm({ ...taxForm, insurance_expiry_date: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </div>
              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row dark:border-slate-800 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setIsTaxModalOpen(false)}
                  className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingTax}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingTax ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
