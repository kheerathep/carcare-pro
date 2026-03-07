export interface Database {
  public: {
    Tables: {
      cars: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          model: string;
          plate_number: string;
          year: number | null;
          Mileage : number | null;
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
          Mileage : number | null;
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
          Mileage : number | null;
          created_at: string;
        };
      };
    };
  };
}

export type Car = Database['public']['Tables']['cars']['Row'];
export type Repair = Database['public']['Tables']['repairs']['Row'] & { cars?: Car };
export type Appointment = Database['public']['Tables']['appointments']['Row'] & { cars?: Car };