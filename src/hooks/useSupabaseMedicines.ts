import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Medicine, Sale, UserSettings, StockInfo, StockLevel } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useSupabaseMedicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchMedicines();
    fetchSales();
    fetchSettings();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedicines((data || []) as Medicine[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch medicines: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch sales: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data as UserSettings);
    } catch (error: any) {
      console.error('Error fetching settings:', error.message);
    }
  };

  const addMedicine = async (medicineData: Omit<Medicine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('medicines')
        .insert([{
          ...medicineData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setMedicines(prev => [...prev, data as Medicine]);
      toast({
        title: "Success",
        description: "Medicine added successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to add medicine: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMedicines(prev => prev.map(med => med.id === id ? data as Medicine : med));
      toast({
        title: "Success",
        description: "Medicine updated successfully",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update medicine: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedicines(prev => prev.filter(med => med.id !== id));
      setSales(prev => prev.filter(sale => sale.medicine_id !== id));
      
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete medicine: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const addSale = async (medicineId: string, unitType: string, quantitySold: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) throw new Error('Medicine not found');

      // Calculate available stock and unit price
      const totalTablets = medicine.strips * medicine.tablets_per_strip + medicine.remaining_tablets_in_current_strip;
      let availableStock = 0;
      let unitPrice = 0;

      if (unitType === 'tablet') {
        availableStock = totalTablets;
        unitPrice = medicine.mrp / medicine.tablets_per_strip;
      } else if (unitType === 'strip') {
        availableStock = Math.floor(totalTablets / medicine.tablets_per_strip);
        unitPrice = medicine.mrp;
      } else {
        availableStock = medicine.strips;
        unitPrice = medicine.mrp;
      }

      if (quantitySold > availableStock) {
        throw new Error(`Insufficient stock. Available: ${availableStock} ${unitType}(s)`);
      }

      // Record the sale
      const saleData = {
        user_id: user.id,
        medicine_id: medicineId,
        medicine_name: medicine.name,
        unit_type: unitType,
        quantity_sold: quantitySold,
        unit_price: unitPrice,
        total_amount: unitPrice * quantitySold
      };

      const { data: saleRecord, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Update medicine stock
      let newStrips = medicine.strips;
      let newRemainingTablets = medicine.remaining_tablets_in_current_strip;

      if (unitType === 'tablet') {
        let tabletsToRemove = quantitySold;
        
        if (tabletsToRemove <= newRemainingTablets) {
          newRemainingTablets -= tabletsToRemove;
        } else {
          tabletsToRemove -= newRemainingTablets;
          newRemainingTablets = 0;
          
          const stripsToRemove = Math.ceil(tabletsToRemove / medicine.tablets_per_strip);
          newStrips -= stripsToRemove;
          
          const remainingFromLastStrip = tabletsToRemove % medicine.tablets_per_strip;
          if (remainingFromLastStrip > 0) {
            newRemainingTablets = medicine.tablets_per_strip - remainingFromLastStrip;
          }
        }
      } else if (unitType === 'strip') {
        newStrips -= quantitySold;
      }

      await updateMedicine(medicineId, {
        strips: Math.max(0, newStrips),
        remaining_tablets_in_current_strip: newRemainingTablets
      });

      setSales(prev => [saleRecord, ...prev]);

      toast({
        title: "Sale Recorded",
        description: `Sold ${quantitySold} ${unitType}(s) of ${medicine.name}`,
      });

      return saleRecord;
    } catch (error: any) {
      toast({
        title: "Sale Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStockInfo = (medicine: Medicine): StockInfo => {
    const totalTablets = medicine.strips * medicine.tablets_per_strip + medicine.remaining_tablets_in_current_strip;
    const threshold = settings?.low_stock_threshold || 10;
    const criticalThreshold = settings?.critical_stock_threshold || 5;

    let level: StockLevel = 'good';
    let message = `${totalTablets} tablets available`;

    if (totalTablets <= criticalThreshold) {
      level = 'critical';
      message = `Critical: Only ${totalTablets} tablets left!`;
    } else if (totalTablets <= threshold) {
      level = 'low';
      message = `Low stock: ${totalTablets} tablets remaining`;
    }

    return {
      totalTablets,
      level,
      message
    };
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...newSettings
        })
        .select()
        .single();

      if (error) throw error;
      setSettings(data as UserSettings);

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return {
    medicines,
    sales,
    settings,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addSale,
    getStockInfo,
    updateSettings,
    refetch: () => {
      fetchMedicines();
      fetchSales();
      fetchSettings();
    }
  };
};