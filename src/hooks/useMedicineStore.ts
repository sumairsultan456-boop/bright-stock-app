import { useState, useEffect } from 'react';
import { Medicine, Sale, DailySales, StockInfo, StockLevel } from '@/types/medicine';

const STORAGE_KEYS = {
  MEDICINES: 'medicine-tracker-medicines',
  SALES: 'medicine-tracker-sales',
  SETTINGS: 'medicine-tracker-settings'
};

interface Settings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
}

const DEFAULT_SETTINGS: Settings = {
  lowStockThreshold: 20,
  criticalStockThreshold: 5
};

export function useMedicineStore() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMedicines = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    const savedSales = localStorage.getItem(STORAGE_KEYS.SALES);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines));
    }
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Medicine operations
  const addMedicine = (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMedicine: Medicine = {
      ...medicineData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setMedicines(prev => [...prev, newMedicine]);
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, ...updates, updatedAt: new Date() } : med
    ));
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
    // Also remove related sales
    setSales(prev => prev.filter(sale => sale.medicineId !== id));
  };

  // Sales operations
  const addSale = (medicineId: string, tabletsCount: number) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return false;

    const totalTablets = medicine.strips * medicine.tabletsPerStrip;
    if (tabletsCount > totalTablets) return false;

    // Calculate new stock
    const remainingTablets = totalTablets - tabletsCount;
    const newStrips = Math.floor(remainingTablets / medicine.tabletsPerStrip);
    
    // Update medicine stock
    updateMedicine(medicineId, { strips: newStrips });

    // Add sale record
    const newSale: Sale = {
      id: Date.now().toString(),
      medicineId,
      medicineName: medicine.name,
      tabletsCount,
      totalValue: (tabletsCount * medicine.mrp) / medicine.tabletsPerStrip,
      saleDate: new Date()
    };
    
    setSales(prev => [...prev, newSale]);
    return true;
  };

  // Stock calculations
  const getStockInfo = (medicine: Medicine): StockInfo => {
    const totalTablets = medicine.strips * medicine.tabletsPerStrip;
    
    let level: StockLevel;
    let message: string;

    if (totalTablets === 0) {
      level = 'critical';
      message = 'Out of stock';
    } else if (totalTablets <= settings.criticalStockThreshold) {
      level = 'critical';
      message = `Only ${totalTablets} tablets left`;
    } else if (totalTablets <= settings.lowStockThreshold) {
      level = 'low';
      message = `Low stock: ${totalTablets} tablets`;
    } else {
      level = 'good';
      message = `In stock: ${totalTablets} tablets`;
    }

    return { totalTablets, level, message };
  };

  // Reports
  const getDailySales = (): DailySales[] => {
    const salesByDate = sales.reduce((acc, sale) => {
      const dateStr = sale.saleDate.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          totalSales: 0,
          totalValue: 0,
          medicines: []
        };
      }

      acc[dateStr].totalSales += sale.tabletsCount;
      acc[dateStr].totalValue += sale.totalValue;
      
      const existingMed = acc[dateStr].medicines.find(m => m.medicineId === sale.medicineId);
      if (existingMed) {
        existingMed.tabletsCount += sale.tabletsCount;
        existingMed.value += sale.totalValue;
      } else {
        acc[dateStr].medicines.push({
          medicineId: sale.medicineId,
          medicineName: sale.medicineName,
          tabletsCount: sale.tabletsCount,
          value: sale.totalValue
        });
      }

      return acc;
    }, {} as Record<string, DailySales>);

    return Object.values(salesByDate).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const getLowStockMedicines = () => {
    return medicines.filter(medicine => {
      const stockInfo = getStockInfo(medicine);
      return stockInfo.level === 'low' || stockInfo.level === 'critical';
    });
  };

  return {
    medicines,
    sales,
    settings,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addSale,
    getStockInfo,
    getDailySales,
    getLowStockMedicines,
    updateSettings: setSettings
  };
}