export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  category: 'medicine' | 'other';
  mrp: number;
  strips: number;
  tablets_per_strip: number;
  remaining_tablets_in_current_strip: number;
  unit_type: string;
  custom_unit_name?: string;
  expiry_date?: string;
  batch_number?: string;
  manufacturer?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  medicine_id: string;
  medicine_name: string;
  unit_type: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  low_stock_threshold: number;
  critical_stock_threshold: number;
  currency: string;
  notifications_enabled: boolean;
  expiry_alert_days: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'low_stock' | 'expiry_alert' | 'high_sales';
  title: string;
  message: string;
  medicine_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ImportLog {
  id: string;
  user_id: string;
  file_name: string;
  import_type: 'pdf' | 'excel' | 'csv';
  total_records: number;
  successful_records: number;
  failed_records: number;
  error_details?: any;
  imported_at: string;
}

export type UnitType = 'tablet' | 'strip' | 'pack' | 'box' | 'bottle' | 'piece';

export type StockLevel = 'good' | 'low' | 'critical';

export interface StockInfo {
  totalTablets: number;
  level: StockLevel;
  message: string;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalValue: number;
  medicines: {
    medicineId: string;
    medicineName: string;
    quantity: number;
    value: number;
  }[];
}