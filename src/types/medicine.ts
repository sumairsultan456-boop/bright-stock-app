export interface Medicine {
  id: string;
  name: string;
  mrp: number;
  strips: number;
  tabletsPerStrip: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  medicineId: string;
  medicineName: string;
  tabletsCount: number;
  totalValue: number;
  saleDate: Date;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalValue: number;
  medicines: {
    medicineId: string;
    medicineName: string;
    tabletsCount: number;
    value: number;
  }[];
}

export type StockLevel = 'good' | 'low' | 'critical';

export interface StockInfo {
  totalTablets: number;
  level: StockLevel;
  message: string;
}