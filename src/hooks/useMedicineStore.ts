import { useState, useEffect } from 'react';
import { Medicine, Sale, DailySales, StockInfo, StockLevel } from '@/types/database';

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
      // Migrate existing medicines to include new fields
      const migratedMedicines = parsedMedicines.map((med: any) => ({
        ...med,
        remaining_tablets_in_current_strip: med.remaining_tablets_in_current_strip ?? 0,
        unit_type: med.unit_type ?? (med.category === 'medicine' ? 'strip' : 'pack'),
        category: med.category ?? 'medicine',
        custom_unit_name: med.custom_unit_name
      }));
      setMedicines(migratedMedicines);
    }
    if (savedSales) {
      const parsedSales = JSON.parse(savedSales);
      // Convert saleDate strings back to Date objects
      const migratedSales = parsedSales.map((sale: any) => ({
        ...sale,
        sale_date: new Date(sale.sale_date || sale.saleDate)
      }));
      setSales(migratedSales);
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
  const addMedicine = (medicineData: Omit<Medicine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const newMedicine: Medicine = {
      ...medicineData,
      id: Date.now().toString(),
      user_id: 'local', // For local storage compatibility
      // Set defaults for new fields if not provided
      unit_type: medicineData.unit_type || (medicineData.category === 'medicine' ? 'strip' : 'pack'),
      category: medicineData.category || 'medicine',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setMedicines(prev => [...prev, newMedicine]);
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(med => 
      med.id === id ? { ...med, ...updates, updated_at: new Date().toISOString() } : med
    ));
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
    // Also remove related sales
    setSales(prev => prev.filter(sale => sale.medicine_id !== id));
  };

  // Sales operations
  const addSale = (medicineId: string, tabletsCount: number) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return false;

    // Calculate total available tablets
    const totalTablets = (medicine.strips || 0) * (medicine.tablets_per_strip || 1) + (medicine.remaining_tablets_in_current_strip || 0);
    if (tabletsCount > totalTablets) return false;

    // Calculate new stock after sale
    let newStrips = medicine.strips || 0;
    let newRemainingTablets = medicine.remaining_tablets_in_current_strip || 0;
    let tabletsToSell = tabletsCount;

    // First, sell from remaining tablets in current strip
    if (newRemainingTablets > 0) {
      const tabletsFromCurrentStrip = Math.min(tabletsToSell, newRemainingTablets);
      newRemainingTablets -= tabletsFromCurrentStrip;
      tabletsToSell -= tabletsFromCurrentStrip;
    }

    // If we still have tablets to sell, start selling full strips
    while (tabletsToSell > 0 && newStrips > 0) {
      if (tabletsToSell >= (medicine.tablets_per_strip || 1)) {
        // Sell a full strip
        newStrips--;
        tabletsToSell -= (medicine.tablets_per_strip || 1);
      } else {
        // Sell partial strip - convert one strip to remaining tablets
        newStrips--;
        newRemainingTablets = (medicine.tablets_per_strip || 1) - tabletsToSell;
        tabletsToSell = 0;
      }
    }
    
    // Update medicine stock
    updateMedicine(medicineId, { 
      strips: newStrips,
      remaining_tablets_in_current_strip: newRemainingTablets
    });

    // Add sale record
    const newSale: Sale = {
      id: Date.now().toString(),
      user_id: 'local',
      medicine_id: medicineId,
      medicine_name: medicine.name,
      unit_type: medicine.unit_type || 'tablet',
      quantity_sold: tabletsCount,
      unit_price: medicine.mrp / (medicine.tablets_per_strip || 1),
      total_amount: (tabletsCount * medicine.mrp) / (medicine.tablets_per_strip || 1),
      sale_date: new Date().toISOString(),
      notes: null
    };
    
    setSales(prev => [...prev, newSale]);
    return true;
  };

  // Stock calculations
  const getStockInfo = (medicine: Medicine): StockInfo => {
    const totalTablets = (medicine.strips || 0) * (medicine.tablets_per_strip || 1) + (medicine.remaining_tablets_in_current_strip || 0);
    
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
      if ((medicine.remaining_tablets_in_current_strip || 0) > 0) {
        message = `${medicine.strips} strips + ${medicine.remaining_tablets_in_current_strip} tablets`;
      } else {
        message = `${medicine.strips} strips (${totalTablets} tablets)`;
      }
    }

    return { totalTablets, level, message };
  };

  // Reports
  const getDailySales = (): DailySales[] => {
    const salesByDate = sales.reduce((acc, sale) => {
      // Handle both Date objects and date strings
      const saleDate = new Date(sale.sale_date);
      const dateStr = saleDate.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          totalSales: 0,
          totalValue: 0,
          medicines: []
        };
      }

      acc[dateStr].totalSales += sale.quantity_sold;
      acc[dateStr].totalValue += sale.total_amount;
      
      const existingMed = acc[dateStr].medicines.find(m => m.medicineId === sale.medicine_id);
      if (existingMed) {
        existingMed.quantity += sale.quantity_sold;
        existingMed.value += sale.total_amount;
      } else {
        acc[dateStr].medicines.push({
          medicineId: sale.medicine_id,
          medicineName: sale.medicine_name,
          quantity: sale.quantity_sold,
          value: sale.total_amount
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