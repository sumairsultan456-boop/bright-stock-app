export type UnitType = 'tablet' | 'strip' | 'pack' | 'box' | 'bottle' | 'piece';

export interface Medicine {
  id: string;
  name: string;
  mrp: number;
  strips: number;
  tabletsPerStrip: number;
  remainingTabletsInCurrentStrip: number; // 0 = current strip is full, >0 = partial strip
  unitType: UnitType;
  customUnitName?: string; // For custom units like "chocolate bar", "bottle", etc.
  category: 'medicine' | 'other';
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