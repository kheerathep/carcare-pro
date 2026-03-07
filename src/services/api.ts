import { supabase } from '../lib/supabase';
import type { Car, Repair, Appointment } from '../types/database';

export const fetchDashboardData = async (userId: string) => {
  try {
    // 1. ดึงข้อมูลรถยนต์
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', userId);

    if (carsError) throw carsError;

    // 2. ดึงประวัติซ่อม (เชื่อมกับรถ)
    const { data: repairs, error: repairsError } = await supabase
      .from('repairs')
      .select('*, cars(*)')
      .eq('user_id', userId)
      .order('repair_date', { ascending: false });

    if (repairsError) throw repairsError;

    // 3. ดึงนัดหมาย (เชื่อมกับรถ)
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('*, cars(*)')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (apptError) throw apptError;

    return {
      cars: cars as Car[],
      repairs: repairs as Repair[],
      appointments: appointments as Appointment[]
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};