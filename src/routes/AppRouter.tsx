import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Import Pages
import Login from "../pages/login";
import LoginPin from "../pages/loginPin";
import Register from "../pages/Register";
import PinSetup from "../pages/PinSetup";
import ForgotPin from "../pages/ForgotPin";
import Dashboard from '../pages/Dashboard';
import DashboardLayout from '../components/layout/DashboardLayout';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import CarDetails from '../pages/CarDetails';
import MyCars from "../pages/Mycars";
import Repairs from '../pages/Repairs';
import Settings from '../pages/Settings'; // 👈 1. เพิ่มบรรทัดนี้เข้ามา

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#101922] text-primary-600 font-medium">กำลังตรวจสอบข้อมูล...</div>
);

// ----------------------------------------------------
// ยามเฝ้าประตู (Guards)
// ----------------------------------------------------

// 1. Guard สำหรับคนแปลกหน้า (หน้า Login/Register)
const GuestGuard = () => {
  const { session, isLoading, isPinVerified } = useAuthStore();
  if (isLoading) return <LoadingScreen />;

  if (session) {
    if (isPinVerified) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login-pin" replace />;
  }
  return <Outlet />; 
};

// 2. Guard สำหรับคนที่ "ล็อกอินแล้ว" 
const AuthGuard = () => {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

// 3. Guard หวงห้าม (ต้องผ่าน PIN เท่านั้น ถึงจะเข้า Dashboard ได้)
const PinGuard = () => {
  const { isPinVerified } = useAuthStore();
  
  if (!isPinVerified) {
    // ถ้ายังไม่ได้ยืนยัน PIN ให้เด้งไปหน้า PIN
    return <Navigate to="/login-pin" replace />;
  }

  return <Outlet />;
};

// ----------------------------------------------------
// Main Router
// ----------------------------------------------------

export default function AppRouter() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* กลุ่มที่ 1: เข้าได้ตอนยังไม่ล็อกอิน */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        
        {/* กลุ่มที่ 2: ต้องมีเซสชัน (Login แล้ว) ถึงเข้าได้ */}
        <Route element={<AuthGuard />}>
          
          {/* หน้าจัดการ PIN (เป็นทั้งหน้าตั้งค่า และหน้าปลดล็อก) */}
          <Route path="/login-pin" element={<LoginPin />} />
          <Route path="/pin-setup" element={<PinSetup />} />
          <Route path="/forgot-pin" element={<ForgotPin />} />

          {/* กลุ่มที่ 3: ด่านสุดท้าย เข้า Dashboard (ต้องผ่านการกรอก PIN ก่อน) */}
          <Route element={<PinGuard />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* 3. หน้าลูกๆ (Dashboard, MyCars) ต้องอยู่ข้างในนี้ */}
              <Route path="/my-cars" element={<MyCars />} />
              <Route path="/my-cars/:carId" element={<CarDetails />} />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
        
        
      </Routes>
      
    </BrowserRouter>
  );
}
