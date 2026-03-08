import React, { useState, useRef } from 'react';
import {
    User, Camera, Lock, Shield, Grip, Cloud,
    EyeOff, Eye, RefreshCw, Settings2, Moon, Globe, LogOut,
    X, CheckCircle, UploadCloud, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function Settings() {
    const navigate = useNavigate();
    const session = useAuthStore((state) => state.session);
    const initializeAuth = useAuthStore((state) => state.initializeAuth);

    // ข้อมูลผู้ใช้
    const userEmail = session?.user?.email || 'user@carcare.pro';
    const userMetaData = session?.user?.user_metadata || {};
    const displayName = userMetaData.full_name || userEmail.split('@')[0];
    const avatarUrl = userMetaData.avatar_url || null;

    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    // 🟢 Modal States
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 🟢 Form States (Profile)
    const [editName, setEditName] = useState(displayName);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(avatarUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🟢 Form States (Password)
    const [currentPassword, setCurrentPassword] = useState(''); // เพิ่มรหัสผ่านปัจจุบัน
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd0, setShowPwd0] = useState(false); // ตาสำหรับรหัสเดิม
    const [showPwd1, setShowPwd1] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        if (!isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) {
            toast.error('ออกจากระบบไม่สำเร็จ');
        }
    };

    // 📸 อัปโหลดรูปโปรไฟล์
    const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) return toast.error('ขนาดรูปต้องไม่เกิน 2MB');
            setProfileFile(file);
            setProfilePreview(URL.createObjectURL(file));
        }
    };

    // 💾 บันทึกโปรไฟล์
    const handleSaveProfile = async () => {
        if (!session?.user?.id) return;
        try {
            setIsSaving(true);
            let finalAvatarUrl = avatarUrl;

            if (profileFile) {
                const fileExt = profileFile.name.split('.').pop();
                const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, profileFile, { upsert: true });
                if (uploadError) throw new Error('อัปโหลดรูปล้มเหลว');

                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                finalAvatarUrl = publicUrl;
            }

            const { error } = await supabase.auth.updateUser({
                data: { full_name: editName, avatar_url: finalAvatarUrl }
            });

            if (error) throw error;

            toast.success('อัปเดตโปรไฟล์เรียบร้อย!');
            await initializeAuth();
            setIsProfileModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
        } finally {
            setIsSaving(false);
        }
    };

    // 🔒 บันทึกรหัสผ่านใหม่
    const handleSavePassword = async () => {
        if (!currentPassword) return toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
        if (newPassword.length < 6) return toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        if (newPassword !== confirmPassword) return toast.error('รหัสผ่านใหม่ไม่ตรงกัน');

        try {
            setIsSaving(true);

            // 1. เช็คว่ารหัสเดิมถูกไหม (ด้วยการพยายาม Login ซ้ำแบบเงียบๆ)
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: currentPassword,
            });

            if (verifyError) {
                setIsSaving(false);
                return toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง!');
            }

            // 2. ถ้ารหัสเดิมถูก ให้ทำการอัปเดตรหัสใหม่
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            toast.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setIsPasswordModalOpen(false);
        } catch (error: any) {
            toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้');
        } finally {
            setIsSaving(false);
        }
    };

    const passwordStrength = newPassword.length === 0 ? 0 : newPassword.length < 6 ? 30 : newPassword.length < 8 ? 60 : 100;
    const strengthColor = passwordStrength < 50 ? 'bg-red-500' : passwordStrength < 80 ? 'bg-amber-500' : 'bg-emerald-500';
    const strengthText = passwordStrength < 50 ? 'อ่อน' : passwordStrength < 80 ? 'ปานกลาง (60%)' : 'ปลอดภัยสูง (100%)';

    return (
        <div className="max-w-4xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
            <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">ตั้งค่าระบบ</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">จัดการบัญชี ความเป็นส่วนตัว และความปลอดภัยของคุณ</p>
                </div>
            </header>

            <div className="space-y-8">
                {/* --- 👤 User Profile Section --- */}
                <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-500">
                            <User size={24} />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">โปรไฟล์ผู้ใช้</h3>
                        </div>
                        <button onClick={() => { setEditName(displayName); setProfilePreview(avatarUrl); setIsProfileModalOpen(true); }} className="px-4 py-2 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 font-bold rounded-lg text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition">
                            แก้ไขโปรไฟล์
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                        {/* 🎯 รูปโปรไฟล์ (ถ้าไม่มีรูป ให้โชว์ไอคอน User) */}
                        <div className="relative group w-28 h-28 shrink-0 mx-auto md:mx-0">
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-400 dark:text-slate-500" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ชื่อผู้ใช้งาน</label>
                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{displayName}</div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">อีเมลบัญชี</label>
                                <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 text-slate-500 dark:text-slate-400">{userEmail}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- 🛡️ Security Section --- */}
                <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-emerald-600 dark:text-emerald-500">
                        <Shield size={24} />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">ความปลอดภัย</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col items-start justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-base">เปลี่ยนรหัสผ่าน</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">อัปเดตรหัสผ่านใหม่เพื่อความปลอดภัย</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPasswordModalOpen(true)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm">
                                เปลี่ยนรหัสผ่าน
                            </button>
                        </div>
                        <div className="flex flex-col items-start justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Grip size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-base">ตั้งค่ารหัส PIN</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">เปลี่ยนรหัส 6 หลักสำหรับเข้าแอป</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPinModalOpen(true)} className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20">
                                เปลี่ยน PIN
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- ⚙️ Preferences Section --- */}
                <section className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-violet-600 dark:text-violet-500">
                        <Settings2 size={24} />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">การปรับแต่งระบบ</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <Moon size={20} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">โหมดกลางคืน</span>
                            </div>
                            <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="pt-8 pb-12 flex justify-center">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full md:w-auto px-10 py-3.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl font-bold transition-all border border-red-100 dark:border-red-500/20">
                        <LogOut size={20} /> ออกจากระบบ
                    </button>
                </section>
            </div>

            {/* =========================================
          🟢 MODAL 1: แก้ไขโปรไฟล์ 
          ========================================= */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">แก้ไขโปรไฟล์</h3>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            <input type="file" ref={fileInputRef} onChange={handleProfileFileChange} accept="image/*" className="hidden" />

                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group w-24 h-24">
                                    {/* 🎯 รูปโปรไฟล์ (ถ้าไม่มีโชว์ User ไอคอน) */}
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-slate-400 dark:text-slate-500" />
                                        )}
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 border-2 border-white dark:border-slate-900">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">รองรับ JPG, PNG สูงสุด 2MB</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">ชื่อแสดงผล</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsProfileModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">ยกเลิก</button>
                                <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50">
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
          🔵 MODAL 2: เปลี่ยนรหัสผ่าน (มีปุ่มลืมรหัสผ่าน)
          ========================================= */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">เปลี่ยนรหัสผ่าน</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">

                            {/* 🎯 ช่องกรอกรหัสผ่านปัจจุบัน พร้อมปุ่มลืมรหัสผ่าน */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">รหัสผ่านปัจจุบัน</label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                // สั่งให้ Supabase ส่งอีเมลรีเซ็ตรหัสผ่านไปที่อีเมลของผู้ใช้เลย
                                                const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
                                                if (error) throw error;
                                                toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว!');
                                                setIsPasswordModalOpen(false); // ปิดหน้าต่าง
                                            } catch (error: any) {
                                                toast.error('ไม่สามารถส่งอีเมลได้: ' + error.message);
                                            }
                                        }}
                                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        ลืมรหัสผ่าน?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type={showPwd0 ? "text" : "password"} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="••••••••" />
                                    <button onClick={() => setShowPwd0(!showPwd0)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600">
                                        {showPwd0 ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                            {/* ช่องรหัสผ่านใหม่ */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">รหัสผ่านใหม่</label>
                                <div className="relative">
                                    <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showPwd1 ? "text" : "password"} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="••••••••" />
                                    <button onClick={() => setShowPwd1(!showPwd1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600">
                                        {showPwd1 ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ยืนยันรหัสผ่านใหม่</label>
                                <div className="relative">
                                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type={showPwd2 ? "text" : "password"} className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white transition-all" placeholder="••••••••" />
                                    <button onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600">
                                        {showPwd2 ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-500">ความปลอดภัย</span>
                                    <span className={`text-xs font-bold ${passwordStrength < 50 ? 'text-red-500' : passwordStrength < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>{strengthText}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                    <div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: `${passwordStrength}%` }}></div>
                                </div>
                            </div>

                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="flex-1 px-4 h-11 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
                            <button onClick={handleSavePassword} disabled={isSaving || !newPassword || !currentPassword} className="flex-1 px-4 h-11 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25 transition-all disabled:opacity-50">
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
          🟠 MODAL 3: เปลี่ยนรหัส PIN (มีปุ่มลืม PIN)
          ========================================= */}
            {isPinModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <Grip size={32} />
                        </div>
                        <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">ไปที่หน้าตั้งค่า PIN</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">ระบบจะพาคุณไปยังหน้ายืนยันและตั้งค่า PIN ใหม่</p>

                        <div className="flex gap-3 mb-6">
                            <button onClick={() => setIsPinModalOpen(false)} className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors">ยกเลิก</button>
                            <button onClick={() => navigate('/pin-setup')} className="flex-1 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all">เปลี่ยน PIN</button>
                        </div>

                        {/* 🎯 ปุ่มลืมรหัส PIN */}
                        <button onClick={() => { setIsPinModalOpen(false); navigate('/forgot-pin'); }} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                            ลืมรหัส PIN ใช่หรือไม่?
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}