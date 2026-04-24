import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type Database = {
  public: {
    Tables: {
      tables: {
        Row: {
          id: string;
          name: string;
          status: 'available' | 'occupied' | 'reserved';
          is_active: boolean;
          session_customer_name: string | null;
          session_start_time: string | null;
          session_duration_minutes: number | null;
          session_is_paid: boolean | null;
          session_hourly_rate: number | null;
          session_amount_paid: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
      };
      queue_items: {
        Row: {
          id: string;
          customer_name: string;
          contact_number: string;
          party_size: number;
          arrival_time: string;
          notes: string | null;
          status: 'waiting' | 'called' | 'seated';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['queue_items']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['queue_items']['Insert']>;
      };
      reservations: {
        Row: {
          id: string;
          customer_name: string;
          contact_number: string;
          email: string | null;
          date: string;
          time_slot: string;
          duration_hours: number;
          party_size: number;
          table_id: string | null;
          status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
          total_amount: number;
          down_payment_amount: number;
          down_payment_paid: boolean;
          balance_paid: boolean;
          cancellation_reason: string | null;
          promo_code: string | null;
          discount_amount: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reservations']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>;
      };
      feedback: {
        Row: {
          id: string;
          customer_name: string;
          contact_info: string | null;
          rating: number;
          feedback_type: 'suggestion' | 'complaint' | 'lost_item' | 'compliment' | 'other' | null;
          comment: string;
          reservation_id: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['feedback']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          type: string;
          description: string;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_percent: number;
          description: string;
          is_active: boolean;
          max_usage: number;
          usage_count: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['promo_codes']['Row'], 'created_at' | 'usage_count'>;
        Update: Partial<Database['public']['Tables']['promo_codes']['Insert']>;
      };
      tattoo_artists: {
        Row: {
          id: string;
          name: string;
          specialty: string;
          contact_number: string;
          email: string | null;
          bio: string | null;
          is_available_today: boolean;
          is_active: boolean;
          unavailable_dates: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tattoo_artists']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['tattoo_artists']['Insert']>;
      };
      tattoo_reservations: {
        Row: {
          id: string;
          customer_name: string;
          contact_number: string;
          email: string | null;
          date: string;
          time_slot: string;
          artist_id: string;
          artist_name: string;
          artist_contact: string;
          placement: string;
          estimated_size: string;
          design_description: string;
          color_style: string;
          agreement_signed: boolean;
          consent_signed: boolean;
          status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
          deposit_amount: number;
          deposit_paid: boolean;
          inspiration_images: string[] | null;
          reschedule_requested: boolean | null;
          proposed_date: string | null;
          proposed_time_slot: string | null;
          customer_reschedule_confirmed: boolean | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tattoo_reservations']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['tattoo_reservations']['Insert']>;
      };
      staff_users: {
        Row: {
          id: string;
          username: string;
          password: string;
          full_name: string;
          email: string;
          role: 'manager' | 'tattoo-artist' | 'cashier';
          is_admin: boolean;
          artist_id: string | null;
          phone: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff_users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['staff_users']['Insert']>;
      };
      rates_config: {
        Row: {
          id: string;
          hourly_rate: number;
          happy_hour_rate: number;
          happy_hour_start: string;
          happy_hour_end: string;
          overtime_rate: number;
          tattoo_deposit: number;
          down_payment_percent: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rates_config']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['rates_config']['Insert']>;
      };
      reservation_terms: {
        Row: {
          id: string;
          min_hours: number;
          max_hours: number;
          min_party_size: number;
          max_party_size: number;
          cancellation_hours: number;
          cancellation_policy: string;
          terms_and_conditions: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reservation_terms']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reservation_terms']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: 'info' | 'warning' | 'promo' | 'event';
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      closed_dates: {
        Row: {
          id: string;
          date: string;
          reason: string;
          is_full_day: boolean;
          open_time: string | null;
          close_time: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['closed_dates']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['closed_dates']['Insert']>;
      };
    };
  };
};
