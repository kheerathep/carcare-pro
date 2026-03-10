import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Repair } from '../types/database';

interface RepairState {
    repairs: Repair[];
    isLoading: boolean;

    // Actions
    fetchRepairs: (userId: string) => Promise<void>;
}

export const useRepairStore = create<RepairState>((set) => ({
    repairs: [],
    isLoading: false,

    fetchRepairs: async (userId: string) => {
        try {
            set({ isLoading: true });

            const { data, error } = await supabase
                .from('repairs')
                .select('*, cars(id, brand, model, plate_number)') // Join with cars
                .eq('user_id', userId)
                .order('repair_date', { ascending: false });

            if (error) throw error;

            set({ repairs: data as unknown as Repair[], isLoading: false });
        } catch (error) {
            console.error('Error fetching repairs:', error);
            set({ isLoading: false });
        }
    },
}));
