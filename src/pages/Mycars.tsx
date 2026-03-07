import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CarFront,
  CheckCircle2,
  Edit3,
  Eye,
  Gauge,
  Image as ImageIcon,
  Plus,
  Search,
  Save,
  Shield,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

type CarRecord = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  plate_number: string;
  year: number;
  color?: string | null;
  image_url: string | null;
  mileage?: number | null;
  created_at?: string | null;
};

type NewCarForm = {
  brand: string;
  model: string;
  plate_number: string;
  year: number;
  color: string;
  mileage: string;
  image_url: string;
};

type ModalMode = 'create' | 'edit';

const DEFAULT_CAR_IMAGE =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200';

const initialFormState: NewCarForm = {
  brand: '',
  model: '',
  plate_number: '',
  year: new Date().getFullYear(),
  color: '',
  mileage: '',
  image_url: '',
};

function getVehicleStatus(car: CarRecord) {
  const mileage = Number(car.mileage || 0);

  if (mileage >= 80000) {
    return {
      label: 'ควรตรวจเช็กระยะ',
      tone: 'warning' as const,
      icon: AlertTriangle,
      badgeClass:
        'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400',
      accentClass: 'group-hover:border-amber-500/40',
      buttonClass:
        'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20',
    };
  }

  return {
    label: 'สถานะปกติ',
    tone: 'normal' as const,
    icon: CheckCircle2,
    badgeClass:
      'bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400',
    accentClass: 'group-hover:border-primary-500/40',
    buttonClass:
      'bg-slate-900 text-white hover:bg-slate-700 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-lg shadow-primary-500/20',
  };
}

function formatMileage(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'ยังไม่ระบุ';
  }
  return `${new Intl.NumberFormat('th-TH').format(value)} กม.`;
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return 'ยังไม่มีข้อมูล';
  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function getCarsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as CarRecord[]) || [];
}

export default function MyCars() {
  const session = useAuthStore((state) => state.session);
  const navigate = useNavigate();
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCar, setNewCar] = useState<NewCarForm>(initialFormState);
  const [selectedImageName, setSelectedImageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ✅ อยู่ใน component
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const loadCars = async () => {
      try {
        setIsLoading(true);
        setCars(await getCarsByUserId(userId));
      } catch (error) {
        console.error('Failed to fetch cars:', error);
        toast.error('โหลดข้อมูลรถไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCars();
  }, [session?.user?.id]);

  const resetModalState = () => {
    setNewCar(initialFormState);
    setSelectedImageName('');
    setSelectedFile(null);
    setEditingCarId(null);
    setModalMode('create');
  };

  const openCreateModal = () => {
    resetModalState();
    setIsModalOpen(true);
  };

  const openEditModal = (car: CarRecord) => {
    setModalMode('edit');
    setEditingCarId(car.id);
    setSelectedImageName('');
    setSelectedFile(null);
    setNewCar({
      brand: car.brand,
      model: car.model,
      plate_number: car.plate_number,
      year: car.year,
      color: car.color || '',
      mileage: car.mileage ? String(car.mileage) : '',
      image_url: car.image_url || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModalState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredCars = cars.filter((car) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [car.brand, car.model, car.plate_number]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(keyword));
  });

  const normalCars = cars.filter((car) => getVehicleStatus(car).tone === 'normal').length;
  const attentionCars = cars.length - normalCars;
  const carsWithImages = cars.filter((car) => Boolean(car.image_url)).length;

  // ✅ handleImageSelect — เก็บ file ไว้ preview และอัปโหลดตอน submit
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('รูปภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setNewCar((current) => ({ ...current, image_url: previewUrl }));
    setSelectedImageName(file.name);
    setSelectedFile(file); // เก็บ file ไว้ upload ตอน submit
  };

  const handleCarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) return;

    try {
      setIsSaving(true);

      if (modalMode === 'edit' && !editingCarId) {
        throw new Error('ไม่พบรถที่ต้องการแก้ไข');
      }

      let imageUrl: string | null = modalMode === 'edit' ? newCar.image_url || null : null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('car-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const payload = {
        brand: newCar.brand.trim(),
        model: newCar.model.trim(),
        plate_number: newCar.plate_number.trim(),
        year: Number(newCar.year),
        color: newCar.color.trim() || null,
        mileage: Number(newCar.mileage) || 0,
        image_url: imageUrl,
      };

      const query =
        modalMode === 'edit'
          ? supabase.from('cars').update(payload).eq('id', editingCarId).eq('user_id', session.user.id)
          : supabase.from('cars').insert([{ ...payload, user_id: session.user.id }]);

      const { error } = await query;
      if (error) throw error;

      toast.success(modalMode === 'edit' ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'เพิ่มรถเรียบร้อยแล้ว');
      closeModal();
      setCars(await getCarsByUserId(session.user.id));
    } catch (error) {
      console.error('Failed to submit car:', error);
      const message = error instanceof Error ? error.message : null;
      toast.error(
        message || (modalMode === 'edit' ? 'บันทึกการแก้ไขไม่สำเร็จ' : 'เพิ่มรถไม่สำเร็จ'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCar = async (car: CarRecord) => {
    if (!session?.user?.id) return;

    const shouldDelete = window.confirm(`ต้องการลบรถ ${car.brand} ${car.model} ใช่หรือไม่?`);
    if (!shouldDelete) return;

    try {
      setDeletingId(car.id);

      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', car.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('ลบรถเรียบร้อย');
      setCars(await getCarsByUserId(session.user.id));
    } catch (error) {
      console.error('Failed to delete car:', error);
      toast.error('ลบรถไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePlaceholderAction = (label: string, car: CarRecord) => {
    toast(`${label} ${car.brand} ${car.model} จะเพิ่มให้ในขั้นถัดไป`);
  };

  const handleOpenRepairForm = (car: CarRecord) => {
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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary-500/10 via-primary-500/5 to-transparent dark:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              <CarFront size={14} />
              Vehicle Fleet
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              จัดการยานพาหนะ
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              ดูแลรถทุกคันในระบบเดียว ค้นหา ตรวจสอบสถานะ และเพิ่มข้อมูลรถใหม่ได้โดยไม่หลุดจาก theme หลักของแอป
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-[280px] max-w-full sm:min-w-[320px]">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ค้นหาทะเบียนรถ, ยี่ห้อ หรือรุ่น..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white"
              />
            </label>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700 active:scale-[0.99]"
            >
              <Plus size={18} />
              เพิ่มรถใหม่
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"><CarFront size={22} /></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-300">ทั้งหมด</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">รถในระบบ</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{cars.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={22} /></div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">พร้อมใช้งาน</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">สถานะปกติ</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{normalCars}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><AlertTriangle size={22} /></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">ตรวจเช็ก</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ต้องติดตาม</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{attentionCars}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"><ImageIcon size={22} /></div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">พร้อมภาพ</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">มีรูปประกอบ</p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{carsWithImages}</p>
        </div>
      </section>

      {filteredCars.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <CarFront size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {cars.length === 0 ? 'ยังไม่มีรถในระบบ' : 'ไม่พบรถที่ค้นหา'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            {cars.length === 0
              ? 'เริ่มเพิ่มรถคันแรกของคุณเพื่อใช้งานระบบติดตามการดูแลรถและประวัติการซ่อม'
              : 'ลองเปลี่ยนคำค้นเป็นยี่ห้อ รุ่น หรือเลขทะเบียนอื่น'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              openCreateModal();
            }}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700"
          >
            <Plus size={18} />
            เพิ่มรถใหม่
          </button>
        </section>
      ) : (
        <section className="grid gap-6">
          {filteredCars.map((car) => {
            const status = getVehicleStatus(car);
            const StatusIcon = status.icon;

            return (
              <article
                key={car.id}
                className={`group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 ${status.accentClass}`}
              >
                <div className="flex flex-col xl:flex-row">
                  <div className="relative aspect-[16/10] w-full overflow-hidden xl:w-[360px] xl:shrink-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${car.image_url || DEFAULT_CAR_IMAGE}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/20 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      <CalendarClock size={14} />
                      อัปเดตล่าสุด {formatUpdatedAt(car.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                    <div>
                      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {car.brand} {car.model}
                          </h2>
                          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <CarFront size={16} />
                            รถส่วนบุคคล • รุ่นปี {car.year}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${status.badgeClass}`}>
                          <StatusIcon size={16} />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">ทะเบียน</span>
                          <span className="mt-2 block text-base font-bold text-slate-900 dark:text-white">{car.plate_number}</span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">เลขไมล์</span>
                          <span className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                            <Gauge size={16} className="text-slate-400" />
                            {formatMileage(car.mileage)}
                          </span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">ประกันภัย</span>
                          <span className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                            <Shield size={16} className="text-slate-400" />
                            ยังไม่ระบุ
                          </span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">หมายเหตุ</span>
                          <span className="mt-2 block text-base font-bold text-slate-900 dark:text-white">
                            {status.tone === 'warning' ? 'ใกล้ถึงรอบเช็กระยะ' : 'พร้อมใช้งาน'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handlePlaceholderAction('หน้ารายละเอียดของ', car)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        <Eye size={18} />
                        รายละเอียด
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRepairForm(car)}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition ${status.buttonClass}`}
                      >
                        <Wrench size={18} />
                        บันทึกซ่อม
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(car)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:text-primary-400"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCar(car)}
                          disabled={deletingId === car.id}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/15 text-primary-600 dark:text-primary-400">
                {modalMode === 'edit' ? <CarFront size={20} /> : <Plus size={20} />}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {modalMode === 'edit' ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถยนต์ใหม่'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCarSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <input
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  type="file"
                  onChange={handleImageSelect}
                />

                {modalMode === 'edit' ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-32 w-32 overflow-hidden rounded-2xl border-2 border-primary-500/30 bg-slate-100 dark:bg-slate-800">
                        {newCar.image_url ? (
                          <img
                            alt="Vehicle preview"
                            className="h-full w-full object-cover"
                            src={newCar.image_url}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon size={36} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-700"
                      >
                        <Camera size={18} />
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">รูปโปรไฟล์รถ</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 text-sm font-medium text-primary-600 transition hover:underline dark:text-primary-400"
                      >
                        {selectedImageName || 'อัปโหลดรูปภาพใหม่'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400">
                      รูปถ่ายรถยนต์
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-8 text-center transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                    >
                      {newCar.image_url ? (
                        <img
                          alt="Vehicle preview"
                          className="mb-3 h-36 w-full rounded-lg object-cover"
                          src={newCar.image_url}
                        />
                      ) : (
                        <Camera size={38} className="mb-3 text-slate-400" />
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {selectedImageName || 'คลิกเพื่ออัปโหลดรูปภาพ'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">PNG, JPG ขนาดไม่เกิน 5MB</p>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ยี่ห้อ (Brand)</span>
                    <input
                      required
                      value={newCar.brand}
                      onChange={(event) => setNewCar((current) => ({ ...current, brand: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder="เช่น Toyota, Honda"
                      type="text"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">รุ่น (Model)</span>
                    <input
                      required
                      value={newCar.model}
                      onChange={(event) => setNewCar((current) => ({ ...current, model: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder="เช่น Camry, Civic"
                      type="text"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ปีที่ผลิต</span>
                    <input
                      required
                      min={1950}
                      max={new Date().getFullYear() + 1}
                      value={newCar.year}
                      onChange={(event) => setNewCar((current) => ({ ...current, year: Number(event.target.value) }))}
                      className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder="เช่น 2023"
                      type="number"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">ทะเบียนรถ</span>
                    <input
                      required
                      value={newCar.plate_number}
                      onChange={(event) => setNewCar((current) => ({ ...current, plate_number: event.target.value }))}
                      className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder="เช่น กก 1234"
                      type="text"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">สี</span>
                    <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                      <div className="h-6 w-6 rounded-full border border-slate-300 bg-slate-900 shadow-inner dark:border-slate-600" />
                      <input
                        value={newCar.color}
                        onChange={(event) => setNewCar((current) => ({ ...current, color: event.target.value }))}
                        className="flex-1 border-none bg-transparent p-0 text-slate-900 placeholder:text-slate-400 focus:border-none focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                        placeholder="เช่น ขาว, ดำ, เทา"
                        type="text"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">เลขไมล์ปัจจุบัน (กม.)</span>
                    <div className="relative">
                      <input
                        value={newCar.mileage}
                        onChange={(event) => setNewCar((current) => ({ ...current, mileage: event.target.value }))}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                        placeholder="เช่น 50000"
                        type="number"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400">km</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 sm:flex-row dark:border-slate-800 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-6 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save size={16} />
                  {isSaving ? 'กำลังบันทึก...' : modalMode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
