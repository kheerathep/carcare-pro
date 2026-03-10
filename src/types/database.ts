export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          pin_hash: string | null;
          full_name: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'mechanic';
          created_at: string;
        };
      };
      cars: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          model: string;
          plate_number: string;
          year: number | null;
          mileage: number | null;
          color: string | null;
          image_url: string | null;
          tax_expiry_date: string | null;
          insurance_expiry_date: string | null;
          insurance_company: string | null;
          created_at: string;
        };
      };
      repairs: {
        Row: {
          id: string;
          user_id: string;
          car_id: string;
          title: string;
          description: string | null;
          repair_date: string;
          cost: number;
          status: 'pending' | 'in_progress' | 'completed';
          mileage: number | null;
          created_at: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          car_id: string;
          title: string;
          appointment_date: string;
          location: string | null;
          status: 'scheduled' | 'completed' | 'cancelled';
          mileage: number | null;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'urgent' | 'warning' | 'info' | 'maintenance' | 'system';
          is_read: boolean;
          related_car_id: string | null;
          created_at: string;
        };
      };
      fuel_logs: {
        Row: {
          id: string;
          car_id: string;
          user_id: string;
          log_date: string;
          mileage: number;
          volume_liters: number;
          total_cost: number;
          created_at: string;
        };
      };
      car_documents: {
        Row: {
          id: string;
          car_id: string;
          user_id: string;
          document_name: string;
          document_type: string;
          file_url: string;
          created_at: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Car = Database['public']['Tables']['cars']['Row'];
export type Repair = Database['public']['Tables']['repairs']['Row'] & { cars?: Car };
export type Appointment = Database['public']['Tables']['appointments']['Row'] & { cars?: Car };
export type Notification = Database['public']['Tables']['notifications']['Row'] & { cars?: Car };
export type FuelLog = Database['public']['Tables']['fuel_logs']['Row'];
export type CarDocument = Database['public']['Tables']['car_documents']['Row'];