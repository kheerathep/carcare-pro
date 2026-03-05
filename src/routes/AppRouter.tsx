import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
//Import Pages
import Login from "../pages/login";
import LoginPin from "../pages/loginPin";
import Register from "../pages/Register";
import PinSetup from "../pages/PinSetup";
import Dashboard from '../pages/Dashboard';
// ----------------------------------------------------
// 1. Components สำหรับ "ยามเฝ้าประตู" (Guards)
// ----------------------------------------------------
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#101922] text-primary">กำลังโหลด...</div>
);

const PinSetupGuard = () => {
  const { isPinVerified } = useAuthStore();

  if (isPinVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Guard A: สำหรับสมาชิกที่ล็อกอินแล้ว (Require Auth)
// ใช้สำหรับหน้าตั้งค่า PIN หรือหน้าที่ไม่ต้องใช้ PIN
const AuthGuard = () => {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (!session) {
    // ถ้ายังไม่ล็อกอิน ส่งไปหน้า Login พร้อมแนบที่อยู่ที่อยากไป (state)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Guard C: สำหรับพื้นที่หวงห้าม (Require PIN)
// ต้องล็อกอิน AND ยืนยัน PIN แล้วเท่านั้น ถึงจะเข้า Dashboard ได้
const PinGuard = () => {
  const { isPinVerified } = useAuthStore();

  if (!isPinVerified) {
    return <Navigate to="/pin-setup" replace />;
  }

  return <Outlet />;
};

// ----------------------------------------------------
// 2. Main Router Configuration
// ----------------------------------------------------

export default function AppRouter() {
  const { initializeAuth } = useAuthStore();

  // เริ่มต้นระบบ: เช็ค Session ทันทีที่ App รัน
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-pin" element={<LoginPin />} />
        <Route path="/register" element={<Register />} />
        
        {/* กลุ่มที่ 1: Protected (ต้องล็อกอินก่อน) */}
        <Route element={<AuthGuard />}>
          {/* 2.1 หน้าจัดการ PIN (เข้าได้เฉพาะคนที่ยังไม่ยืนยัน PIN) */}
          <Route element={<PinSetupGuard />}>
            <Route path="/pin-setup" element={<PinSetup />} />
          </Route>

          {/* 2.2 หน้า Dashboard & อื่นๆ (ต้องผ่าน PIN Guard อีกชั้น) */}
          <Route element={<PinGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/vehicles" element={<VehiclesPage />} /> */}
            {/* <Route path="/repairs" element={<RepairsPage />} /> */}
          </Route>

        </Route>

        {/* กรณีพิมพ์ URL มั่วๆ ให้เด้งไปหน้า Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}
