export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // UUID อ้างอิง auth.users
          pin_hash: string | null // เก็บ PIN 6 หลักที่เข้ารหัสแล้ว
          created_at: string
        }
        Insert: {
          id: string
          pin_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pin_hash?: string | null
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          brand: string
          model: string
          year: number
          plate: string
          color: string | null
          mileage: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand: string
          model: string
          year: number
          plate: string
          color?: string | null
          mileage: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand?: string
          model?: string
          year?: number
          plate?: string
          color?: string | null
          mileage?: number
          image_url?: string | null
          created_at?: string
        }
      }
      repairs: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          category: string // 12 ประเภท
          status: 'เสร็จสิ้น' | 'กำลังซ่อม' | 'นัดหมาย'
          shop_name: string | null
          details: string | null
          mileage: number
          cost: number
          next_appointment_date: string | null
          next_mileage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          category: string
          status: 'เสร็จสิ้น' | 'กำลังซ่อม' | 'นัดหมาย'
          shop_name?: string | null
          details?: string | null
          mileage: number
          cost: number
          next_appointment_date?: string | null
          next_mileage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          category?: string
          status?: 'เสร็จสิ้น' | 'กำลังซ่อม' | 'นัดหมาย'
          shop_name?: string | null
          details?: string | null
          mileage?: number
          cost?: number
          next_appointment_date?: string | null
          next_mileage?: number | null
          created_at?: string
        }
      }
    }
  }
}

// 🔥 เพิ่มส่วนนี้ไว้ล่างสุด เพื่อให้ดึง Type ไปใช้ใน Component ได้ง่ายๆ
// วาง 3 บรรทัดนี้ไว้ล่างสุดของไฟล์ src/types/database.ts
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Repair = Database['public']['Tables']['repairs']['Row'];