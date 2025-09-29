export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_reports: {
        Row: {
          created_at: string
          date: string
          expiring_items: number
          id: string
          low_stock_items: number
          report_data: Json
          sales_count: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          expiring_items?: number
          id?: string
          low_stock_items?: number
          report_data: Json
          sales_count?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          expiring_items?: number
          id?: string
          low_stock_items?: number
          report_data?: Json
          sales_count?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          error_details: Json | null
          failed_records: number | null
          file_name: string
          id: string
          import_type: string
          imported_at: string | null
          successful_records: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          error_details?: Json | null
          failed_records?: number | null
          file_name: string
          id?: string
          import_type: string
          imported_at?: string | null
          successful_records?: number | null
          total_records?: number | null
          user_id: string
        }
        Update: {
          error_details?: Json | null
          failed_records?: number | null
          file_name?: string
          id?: string
          import_type?: string
          imported_at?: string | null
          successful_records?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          barcode: string | null
          batch_number: string | null
          category: string
          created_at: string | null
          custom_unit_name: string | null
          description: string | null
          expiry_date: string | null
          id: string
          manufacturer: string | null
          mrp: number
          name: string
          remaining_tablets_in_current_strip: number | null
          strips: number | null
          tablets_per_strip: number | null
          unit_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          batch_number?: string | null
          category?: string
          created_at?: string | null
          custom_unit_name?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          mrp: number
          name: string
          remaining_tablets_in_current_strip?: number | null
          strips?: number | null
          tablets_per_strip?: number | null
          unit_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          batch_number?: string | null
          category?: string
          created_at?: string | null
          custom_unit_name?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          manufacturer?: string | null
          mrp?: number
          name?: string
          remaining_tablets_in_current_strip?: number | null
          strips?: number | null
          tablets_per_strip?: number | null
          unit_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          medicine_id: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          medicine_id?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          medicine_id?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          medicine_id: string
          medicine_name: string
          notes: string | null
          quantity_sold: number
          sale_date: string | null
          total_amount: number
          unit_price: number
          unit_type: string
          user_id: string
        }
        Insert: {
          id?: string
          medicine_id: string
          medicine_name: string
          notes?: string | null
          quantity_sold: number
          sale_date?: string | null
          total_amount: number
          unit_price: number
          unit_type: string
          user_id: string
        }
        Update: {
          id?: string
          medicine_id?: string
          medicine_name?: string
          notes?: string | null
          quantity_sold?: number
          sale_date?: string | null
          total_amount?: number
          unit_price?: number
          unit_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          critical_stock_threshold: number | null
          currency: string | null
          expiry_alert_days: number | null
          id: string
          low_stock_threshold: number | null
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          critical_stock_threshold?: number | null
          currency?: string | null
          expiry_alert_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          critical_stock_threshold?: number | null
          currency?: string | null
          expiry_alert_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
