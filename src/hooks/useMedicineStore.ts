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
      const parsedMedicines = JSON.parse(savedMedicines);
      // Migrate existing medicines to include remainingTabletsInCurrentStrip field
      const migratedMedicines = parsedMedicines.map((med: any) => ({
        ...med,
        remainingTabletsInCurrentStrip: med.remainingTabletsInCurrentStrip ?? 0
      }));
      setMedicines(migratedMedicines);
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

    // Calculate total available tablets
    const totalTablets = medicine.strips * medicine.tabletsPerStrip + medicine.remainingTabletsInCurrentStrip;
    if (tabletsCount > totalTablets) return false;

    // Calculate new stock after sale
    let newStrips = medicine.strips;
    let newRemainingTablets = medicine.remainingTabletsInCurrentStrip;
    let tabletsToSell = tabletsCount;

    // First, sell from remaining tablets in current strip
    if (newRemainingTablets > 0) {
      const tabletsFromCurrentStrip = Math.min(tabletsToSell, newRemainingTablets);
      newRemainingTablets -= tabletsFromCurrentStrip;
      tabletsToSell -= tabletsFromCurrentStrip;
    }

    // If we still have tablets to sell, start selling full strips
    while (tabletsToSell > 0 && newStrips > 0) {
      if (tabletsToSell >= medicine.tabletsPerStrip) {
        // Sell a full strip
        newStrips--;
        tabletsToSell -= medicine.tabletsPerStrip;
      } else {
        // Sell partial strip - convert one strip to remaining tablets
        newStrips--;
        newRemainingTablets = medicine.tabletsPerStrip - tabletsToSell;
        tabletsToSell = 0;
      }
    }
    
    // Update medicine stock
    updateMedicine(medicineId, { 
      strips: newStrips,
      remainingTabletsInCurrentStrip: newRemainingTablets
    });

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
    const totalTablets = medicine.strips * medicine.tabletsPerStrip + medicine.remainingTabletsInCurrentStrip;
    
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
      if (medicine.remainingTabletsInCurrentStrip > 0) {
        message = `${medicine.strips} strips + ${medicine.remainingTabletsInCurrentStrip} tablets`;
      } else {
        message = `${medicine.strips} strips (${totalTablets} tablets)`;
      }
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