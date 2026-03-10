import React, { useEffect, useState, useRef } from 'react';
import {
  BatteryCharging, CarFront, CircleDot, ClipboardCheck,
  Disc3, Fuel, MoreHorizontal, Paintbrush, Plus, Save,
  Search, Settings2, Wind, Wrench, X, Zap, Download,
  Trash2, Image as ImageIcon, Store, CalendarDays, MapPin, Info, UploadCloud, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useRepairStore } from '../store/useRepairStore';

// --- Types ---
type CarOption = { id: string; brand: string; model: string; plate_number: string; image_url?: string | null; };
type RepairRecord = {
  id: string; user_id: string; car_id: string; title: string;
  description: string | null; repair_date: string; cost: number;
  status: 'pending' | 'in_progress' | 'completed';
  receipt_url?: string | null;
  cars?: CarOption | null;
};
type RepairForm = {
  car_id: string; category: string; title: string; shop_name: string;
  description: string; mileage: string; cost: string;
  status: 'pending' | 'in_progress' | 'completed';
  repair_date: string;
  receipt_url: string | null;
};

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

function getTodayDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const initialFormState: RepairForm = {
  car_id: '', category: 'other', title: '', shop_name: '', description: '',
  mileage: '', cost: '', status: 'completed', repair_date: getTodayDate(),
  receipt_url: null
};

// --- Helpers ---
function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatMoney(amount: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount || 0);
}
function extractShopName(description?: string | null) {
  return description?.split('\n').find(l => l.toLowerCase().startsWith('ร้าน/อู่:'))?.replace('ร้าน/อู่:', '').trim() || 'ไม่ได้ระบุร้าน';
}
function extractCategory(description?: string | null) {
  const catLabel = description?.split('\n').find(l => l.toLowerCase().startsWith('หมวดหมู่:'))?.replace('หมวดหมู่:', '').trim();
  return repairCategories.find(c => c.label === catLabel)?.id || 'other';
}
function extractMileage(description?: string | null) {
  return description?.split('\n').find(l => l.toLowerCase().startsWith('เลขไมล์:'))?.replace('เลขไมล์:', '').replace('km', '').trim() || '';
}
function extractCleanDescription(description?: string | null) {
  return description?.split('\n').find(l => l.toLowerCase().startsWith('รายละเอียด:'))?.replace('รายละเอียด:', '').trim() || description || '';
}

export default function Repairs() {
  const session = useAuthStore((state) => state.session);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const repairs = useRepairStore((state) => state.repairs) as RepairRecord[];
  const fetchRepairs = useRepairStore((state) => state.fetchRepairs);

  const [cars, setCars] = useState<CarOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [form, setForm] = useState<RepairForm>(initialFormState);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const userDisplayName = session?.user?.email?.split('@')[0] || 'ผู้ใช้งาน';

  const loadData = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      // Fetch cars for the select box
      const { data: carsData } = await supabase.from('cars').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      setCars(carsData as CarOption[] || []);

      // Also fetch repairs through global store
      await fetchRepairs(userId);
    } catch (error) {
      toast.error('โหลดข้อมูลไม่สำเร็จ');
      console.error(error);
    }
  };

  useEffect(() => { loadData(); }, [session?.user?.id]);

  const openCreateModal = (carId?: string) => {
    if (!cars.length) return toast.error('เพิ่มรถอย่างน้อย 1 คันก่อนบันทึกการซ่อม');
    setForm({ ...initialFormState, car_id: carId || cars[0]?.id || '' });
    setReceiptFile(null); setPreviewUrl(null);
    setModalMode('create');
  };

  const openViewModal = (repair: RepairRecord) => {
    setSelectedRepair(repair);
    setModalMode('view');
  };

  const openEditModal = () => {
    if (!selectedRepair) return;
    setForm({
      car_id: selectedRepair.car_id,
      category: extractCategory(selectedRepair.description),
      title: selectedRepair.title,
      shop_name: extractShopName(selectedRepair.description),
      description: extractCleanDescription(selectedRepair.description),
      mileage: extractMileage(selectedRepair.description),
      cost: selectedRepair.cost.toString(),
      status: selectedRepair.status,
      repair_date: selectedRepair.repair_date,
      receipt_url: selectedRepair.receipt_url || null
    });
    setReceiptFile(null);
    setPreviewUrl(selectedRepair.receipt_url || null);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null); setSelectedRepair(null); setIsDeleteModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setReceiptFile(null); setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm({ ...form, receipt_url: null });
  };

  const handleDelete = async () => {
    if (!selectedRepair) return;
    try {
      setIsSaving(true);
      const { error } = await supabase.from('repairs').delete().eq('id', selectedRepair.id);
      if (error) throw error;
      toast.success('ลบบันทึกเรียบร้อย');
      closeModal(); loadData();
    } catch (error) {
      toast.error('ลบไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) return;

    try {
      setIsSaving(true);
      let finalReceiptUrl = form.receipt_url;

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, receiptFile);
        if (uploadError) throw new Error('อัปโหลดรูปภาพไม่สำเร็จ');
        const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath);
        finalReceiptUrl = publicUrl;
      }

      const selectedCategory = repairCategories.find((c) => c.id === form.category);
      const descriptionLines = [
        selectedCategory ? `หมวดหมู่: ${selectedCategory.label}` : null,
        form.shop_name.trim() ? `ร้าน/อู่: ${form.shop_name.trim()}` : null,
        form.mileage.trim() ? `เลขไมล์: ${form.mileage.trim()} km` : null,
        form.description.trim() ? `รายละเอียด: ${form.description.trim()}` : null,
      ].filter(Boolean);

      const payload = {
        user_id: session.user.id, car_id: form.car_id,
        title: form.title.trim(),
        description: descriptionLines.join('\n') || null,
        repair_date: form.repair_date,
        cost: Number(form.cost) || 0,
        status: form.status, receipt_url: finalReceiptUrl
      };

      if (modalMode === 'edit' && selectedRepair) {
        const { error } = await supabase.from('repairs').update(payload).eq('id', selectedRepair.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('repairs').insert([payload]);
        if (error) throw error;
      }
      toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
      closeModal(); loadData();
    } catch (error: any) {
      toast.error(error.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRepairs = repairs.filter((r) => !searchQuery || [r.title, r.cars?.brand, r.cars?.plate_number].some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase())));
  const totalCost = repairs.reduce((sum, r) => sum + Number(r.cost || 0), 0);

  const handleExportCSV = () => {
    if (!filteredRepairs.length) return toast.error('ไม่มีข้อมูลให้ส่งออก');

    const headers = ['วันที่ซ่อม', 'หัวข้อบริการ', 'รายละเอียด', 'ศูนย์บริการ', 'เลขไมล์', 'ค่าใช้จ่าย', 'สถานะ'];

    const rows = filteredRepairs.map((r) => [
      formatDate(r.repair_date),
      `"${r.title.replace(/"/g, '""')}"`,
      `"${extractCleanDescription(r.description).replace(/"/g, '""')}"`,
      `"${extractShopName(r.description).replace(/"/g, '""')}"`,
      extractMileage(r.description),
      r.cost,
      r.status === 'completed' ? 'เสร็จสิ้น' : 'รอ/กำลังซ่อม'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `carcare_history_${getTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 print:m-0 print:p-0">

      {/* 🟢 หน้าจอหลัก */}
      <div className="print:hidden space-y-8">
        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <span className="hover:text-primary-600 cursor-pointer">หน้าหลัก</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">ประวัติการซ่อม</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">ประวัติการซ่อมบำรุง</h2>
            <p className="text-slate-500 mt-1">คุณมีบันทึกทั้งหมด {repairs.length} รายการ (รวม {formatMoney(totalCost)})</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="relative flex-1 sm:flex-none">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาประวัติ..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-primary-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            </label>
            <button onClick={handleExportCSV} className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/50 shadow-sm">
              <Download size={16} />
              Export CSV
            </button>
            <button onClick={() => openCreateModal()} className="h-10 w-full sm:w-auto bg-primary-600 text-white px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition shadow-lg shadow-primary-600/20">
              <Plus size={16} /> เพิ่มบันทึกใหม่
            </button>
          </div>
        </header>

        {/* 🟢 รายการประวัติ (ใช้ไอคอนตามหมวดหมู่) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 hidden sm:table-header-group">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">รายการซ่อม</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">อู่/ศูนย์บริการ</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">ค่าใช้จ่าย</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRepairs.map((repair) => {
                const categoryId = extractCategory(repair.description);
                const CategoryIcon = repairCategories.find(c => c.id === categoryId)?.icon || Wrench;

                return (
                  <tr key={repair.id} onClick={() => openViewModal(repair)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex flex-col sm:table-row p-4 sm:p-0">
                    <td className="sm:px-6 sm:py-4 text-sm text-slate-500 dark:text-slate-400 mb-2 sm:mb-0">
                      <span className="sm:hidden font-bold mr-2">วันที่:</span>{formatDate(repair.repair_date)}
                    </td>
                    <td className="sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 flex items-center justify-center shrink-0">
                          <CategoryIcon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{repair.title}</p>
                          <p className="text-xs text-slate-500">{repair.cars?.brand} ({repair.cars?.plate_number})</p>
                        </div>
                      </div>
                    </td>
                    <td className="sm:px-6 sm:py-4 text-sm text-slate-600 dark:text-slate-300">
                      <span className="sm:hidden font-bold mr-2">ร้าน:</span>{extractShopName(repair.description)}
                    </td>
                    <td className="sm:px-6 sm:py-4 text-right font-bold text-slate-900 dark:text-white">
                      <span className="sm:hidden mr-2">ราคา:</span>{formatMoney(repair.cost)}
                    </td>
                    <td className="sm:px-6 sm:py-4 text-center mt-2 sm:mt-0">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${repair.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {repair.status === 'completed' ? 'เสร็จสิ้น' : 'รอ/กำลังซ่อม'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRepairs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    ไม่พบข้อมูลประวัติการซ่อม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 MAIN MODAL (View / Create / Edit) */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 md:p-8 backdrop-blur-sm print:static print:bg-white print:p-0">
          <div className="bg-white dark:bg-[#101922] w-full max-w-6xl h-full max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-[#223649] print:shadow-none print:border-none print:h-auto">

            {/* --- 🔵 โหมด: View Details --- */}
            {modalMode === 'view' && selectedRepair && (
              <>
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#223649] flex items-center justify-between print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-600">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">รายละเอียดการบันทึกบริการ</h3>
                      <p className="text-xs text-slate-500">ID: {selectedRepair.id.split('-')[0].toUpperCase()}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-[#182634] flex items-center justify-center dark:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <div className="bg-[#182634] rounded-xl border border-[#223649] overflow-hidden shadow-xl mb-8">
                    <div className="p-6 border-b border-[#223649] flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-600/10 rounded-xl text-primary-600">
                          <Wrench size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{selectedRepair.title}</h3>
                          <p className="text-[#90adcb] flex items-center gap-2 mt-1 text-sm">
                            <CalendarDays size={14} /> {formatDate(selectedRepair.repair_date)}
                            <span className="text-[#223649]">|</span>
                            <MapPin size={14} /> {extractShopName(selectedRepair.description)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#90adcb] text-sm uppercase font-bold tracking-wider">ยอดรวมค่าใช้จ่าย</p>
                        <p className="text-2xl font-black text-primary-600">{formatMoney(selectedRepair.cost)}</p>
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[#90adcb] flex items-center gap-2">
                        <ClipboardCheck size={18} /> รายละเอียดงานที่ทำ
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#101922]/50 p-4 rounded-lg border border-[#223649] flex items-start gap-3">
                          <CheckCircle size={20} className="text-primary-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-white">ข้อมูลรถยนต์</p>
                            <p className="text-xs text-[#90adcb] mt-1">{selectedRepair.cars?.brand} {selectedRepair.cars?.model} ({selectedRepair.cars?.plate_number})</p>
                          </div>
                        </div>
                        <div className="bg-[#101922]/50 p-4 rounded-lg border border-[#223649] flex items-start gap-3">
                          <CheckCircle size={20} className="text-primary-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-white">เลขไมล์ล่าสุด</p>
                            <p className="text-xs text-[#90adcb] mt-1">{extractMileage(selectedRepair.description) || '-'} กม.</p>
                          </div>
                        </div>
                        <div className="bg-[#101922]/50 p-4 rounded-lg border border-[#223649] flex items-start gap-3 md:col-span-2">
                          <Info size={20} className="text-primary-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm text-white">บันทึกเพิ่มเติม</p>
                            <p className="text-xs text-[#90adcb] mt-1 whitespace-pre-line">{extractCleanDescription(selectedRepair.description) || 'ไม่มีการระบุรายละเอียด'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 รูปภาพใบเสร็จ (แก้ ZoomIn เป็น Search แล้ว) */}
                  {selectedRepair.receipt_url && (
                    <div className="print:hidden">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-[#90adcb] mb-4 flex items-center gap-2">
                        <ImageIcon size={18} /> รูปภาพและใบเสร็จ
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="group relative aspect-square rounded-lg overflow-hidden bg-[#101922] border border-[#223649] cursor-pointer">
                          <a href={selectedRepair.receipt_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors z-10 flex items-center justify-center">
                            <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                          </a>
                          <img src={selectedRepair.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent z-20">
                            <p className="text-[10px] text-white truncate">เอกสารแนบ.jpg</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 pb-4 px-6 border-t border-[#223649] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#101922] print:hidden">
                  <div className="flex items-center gap-2 text-[#90adcb] text-sm">
                    <Info size={16} /> บันทึกโดย {userDisplayName}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={openEditModal} className="flex-1 sm:flex-none px-6 py-2.5 bg-[#223649] hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors">
                      แก้ไขบันทึก
                    </button>
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-600/20">
                      <Download size={18} /> ดาวน์โหลด PDF
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* --- 🟠 โหมด: Create / Edit (แบ่งจอ 2 ฝั่ง ซ้ายกรอกข้อมูล ขวาอัปโหลดรูป) --- */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <>
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#223649] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-600">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold dark:text-white">{modalMode === 'edit' ? 'แก้ไขการบันทึกบริการ' : 'เพิ่มบันทึกการซ่อมใหม่'}</h3>
                      {modalMode === 'edit' && <p className="text-xs text-slate-500">แก้ไขข้อมูลใบเสร็จหรือรายการซ่อม</p>}
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-[#182634] flex items-center justify-center dark:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* ฝั่งซ้าย: ข้อมูลฟอร์ม (5/12) */}
                  <div className="w-full md:w-5/12 p-6 overflow-y-auto border-r border-slate-100 dark:border-[#223649]">
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-[#90adcb] uppercase tracking-wider mb-6">ข้อมูลบริการ</h4>
                    <form id="repair-form" onSubmit={handleSubmit} className="space-y-5">
                      {modalMode === 'create' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">เลือกรถยนต์</label>
                          <select required value={form.car_id} onChange={e => setForm({ ...form, car_id: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white">
                            <option value="">-- เลือกรถยนต์ --</option>
                            {cars.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.plate_number})</option>)}
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-white">หัวข้อบริการ</label>
                        <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" placeholder="เช่น เปลี่ยนน้ำมันเครื่องสังเคราะห์ 100%" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">วันที่ซ่อม</label>
                          <input required type="date" value={form.repair_date} onChange={e => setForm({ ...form, repair_date: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">เลขไมล์ (กม.)</label>
                          <input type="number" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-white">ศูนย์บริการ / อู่</label>
                        <div className="relative">
                          <input type="text" value={form.shop_name} onChange={e => setForm({ ...form, shop_name: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" placeholder="ระบุชื่อศูนย์บริการ" />
                          <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">ค่าใช้จ่ายทั้งหมด</label>
                          <div className="relative">
                            <input required type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" placeholder="0" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">฿</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">หมวดหมู่</label>
                          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white">
                            {repairCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium dark:text-white">สถานะการซ่อม</label>
                          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'pending' | 'in_progress' | 'completed' })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white">
                            <option value="pending">รอดำเนินการ</option>
                            <option value="in_progress">กำลังซ่อม</option>
                            <option value="completed">เสร็จสิ้น</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium dark:text-white">หมายเหตุเพิ่มเติม</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-50 dark:bg-[#182634] border border-slate-200 dark:border-[#223649] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white resize-none" placeholder="รายละเอียดอื่นๆ..." rows={3}></textarea>
                      </div>
                    </form>
                  </div>

                  {/* ฝั่งขวา: แนบไฟล์รูปภาพ (7/12) */}
                  <div className="w-full md:w-7/12 p-6 flex flex-col bg-slate-50/50 dark:bg-[#182634]/30 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-[#90adcb] uppercase tracking-wider mb-6 flex items-center justify-between">
                      เอกสารแนบและรูปภาพ
                      <span className="bg-primary-600/10 text-primary-600 dark:text-primary-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {previewUrl ? '1 รายการ' : '0 รายการ'}
                      </span>
                    </h4>

                    {/* Input สำหรับเลือกไฟล์ */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    {/* กล่องอัปโหลดแบบ Drag & Drop UI */}
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-[#334155] rounded-xl p-8 mb-8 flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-600/5 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-[#101922] flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white mb-3 transition-colors shadow-sm">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-sm font-semibold mb-1 dark:text-white">คลิกเพื่ออัปโหลดใบเสร็จ</p>
                      <p className="text-xs text-slate-500 dark:text-[#90adcb]">รองรับไฟล์ JPG, PNG (สูงสุด 5MB)</p>
                    </div>

                    {/* โชว์รูปที่เลือก (Gallery) */}
                    {previewUrl && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 dark:border-[#223649] bg-white dark:bg-[#101922] shadow-sm">
                          <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.preventDefault(); removeFile(); }} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white truncate">รูปภาพแนบ.jpg</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-[#223649] flex justify-between items-center bg-slate-50/50 dark:bg-[#101922]">
                  {modalMode === 'edit' ? (
                    <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 font-medium">
                      <Trash2 size={18} /> ลบบันทึกนี้
                    </button>
                  ) : <div />}
                  <div className="flex gap-3">
                    <button type="button" onClick={closeModal} className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-[#223649] font-medium hover:bg-slate-100 dark:hover:bg-[#182634] dark:text-white transition-colors">
                      ยกเลิก
                    </button>
                    <button type="submit" form="repair-form" disabled={isSaving} className="px-8 py-2.5 rounded-lg bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center gap-2 disabled:opacity-50">
                      <Save size={18} /> {isSaving ? 'กำลังบันทึก...' : (modalMode === 'edit' ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🔴 MODAL ยืนยันการลบข้อมูล */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#182634] p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-slate-200 dark:border-[#223649]">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">ยืนยันการลบข้อมูล?</h3>
            <p className="text-slate-500 dark:text-[#90adcb] mb-8 text-sm">คุณจะไม่สามารถกู้คืนข้อมูลประวัติการซ่อมและรูปภาพใบเสร็จนี้ได้อีกต่อไป</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-[#101922] dark:hover:bg-[#223649] text-slate-700 dark:text-slate-300 rounded-xl font-bold transition">ยกเลิก</button>
              <button onClick={handleDelete} disabled={isSaving} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition flex justify-center items-center">
                {isSaving ? 'กำลังลบ...' : 'ลบข้อมูลถาวร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}