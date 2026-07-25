// Hand-written to match supabase/migrations/0001_init.sql. Once the migration
// is applied to a real project, regenerate with the Supabase MCP
// `generate_typescript_types` tool and replace this file — don't hand-maintain
// both long-term.

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded" | "waived";

export type PaymentMethod = "zelle" | "cashapp" | "card" | "ach" | "cash" | "check" | "other";

export type BlockSource = "manual" | "nunu_image" | "nunu_text" | "system";

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: "owner" | "assistant";
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_users"]["Row"]> & {
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Row"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          duration_minutes: 20 | 30 | 60;
          price_cents: number | null;
          currency: string;
          buffer_after_min: number;
          is_active: boolean;
          is_public: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & {
          slug: string;
          name: string;
          duration_minutes: 20 | 30 | 60;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          timezone: string;
          notes: string | null;
          tags: string[];
          is_blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          timezone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["availability_rules"]["Row"]> & {
          day_of_week: number;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_rules"]["Row"]>;
        Relationships: [];
      };
      availability_blocks: {
        Row: {
          id: string;
          starts_at: string;
          ends_at: string;
          all_day: boolean;
          label: string | null;
          source: BlockSource;
          source_ref: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["availability_blocks"]["Row"]> & {
          starts_at: string;
          ends_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_blocks"]["Row"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          confirmation_code: string;
          client_id: string;
          service_id: string;
          starts_at: string;
          duration_minutes: 20 | 30 | 60;
          ends_at: string;
          client_timezone: string;
          status: AppointmentStatus;
          intake_notes: string | null;
          source: "web" | "admin" | "nunu";
          payment_status: PaymentStatus;
          quoted_price_cents: number | null;
          manage_token: string;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointments"]["Row"]> & {
          client_id: string;
          service_id: string;
          starts_at: string;
          duration_minutes: 20 | 30 | 60;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [];
      };
      appointment_notes: {
        Row: {
          id: string;
          appointment_id: string;
          body: string;
          note_type: "session" | "followup" | "internal" | "system";
          is_pinned: boolean;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appointment_notes"]["Row"]> & {
          appointment_id: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_notes"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string | null;
          client_id: string | null;
          amount_cents: number;
          currency: string;
          method: PaymentMethod;
          status: PaymentStatus;
          reference: string | null;
          received_at: string;
          recorded_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          amount_cents: number;
          method: PaymentMethod;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      nunu_uploads: {
        Row: {
          id: string;
          storage_path: string;
          original_name: string | null;
          mime_type: string | null;
          byte_size: number | null;
          parsed_json: unknown;
          confidence: number | null;
          status: "pending" | "parsed" | "applied" | "rejected" | "failed";
          error_message: string | null;
          applied_at: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["nunu_uploads"]["Row"]> & {
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["nunu_uploads"]["Row"]>;
        Relationships: [];
      };
      nunu_messages: {
        Row: {
          id: string;
          role: "user" | "assistant" | "system";
          content: string;
          upload_id: string | null;
          proposed_action: unknown;
          action_status: "proposed" | "confirmed" | "rejected" | null;
          admin_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["nunu_messages"]["Row"]> & {
          role: "user" | "assistant" | "system";
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["nunu_messages"]["Row"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: { key: string; value: unknown; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_type: "admin" | "client" | "nunu" | "system";
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          before_data: unknown;
          after_data: unknown;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          actor_type: "admin" | "client" | "nunu" | "system";
          action: string;
          entity: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_appointment: {
        Args: {
          p_service_id: string;
          p_starts_at: string;
          p_full_name: string;
          p_email: string;
          p_phone: string | null;
          p_client_timezone: string;
          p_intake_notes: string | null;
        };
        Returns: Database["public"]["Tables"]["appointments"]["Row"];
      };
      cancel_appointment: {
        Args: { p_manage_token: string; p_reason: string | null };
        Returns: Database["public"]["Tables"]["appointments"]["Row"];
      };
      reschedule_appointment: {
        Args: { p_manage_token: string; p_new_starts_at: string };
        Returns: Database["public"]["Tables"]["appointments"]["Row"];
      };
      get_appointment_by_token: {
        Args: { p_manage_token: string };
        Returns: {
          id: string;
          confirmation_code: string;
          starts_at: string;
          duration_minutes: number;
          status: AppointmentStatus;
          service_id: string;
          service_slug: string;
          service_name: string;
          client_full_name: string;
          client_timezone: string;
        }[];
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      block_source: BlockSource;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type BookingSettings = {
  lead_time_hours: number;
  booking_window_days: number;
  slot_granularity_min: number;
  max_per_day: number | null;
  cancel_cutoff_hours: number;
};

export type BusinessSettings = {
  name: string;
  timezone: string;
};

export type PaymentsSettings = {
  public_message: string;
  collect_at_booking: boolean;
};
