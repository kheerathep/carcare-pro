import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void; // 👈 ต้องเพิ่มตรงนี้
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark', // ตั้งค่าเริ่มต้นเป็น Dark Mode
      isSidebarOpen: false,
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }), // 👈 2. เพิ่มฟังก์ชันนี้ใน Store
    }),
    {
      name: 'carcare-app-storage', // บันทึกลง LocalStorage
    }
  )
);