import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Medicine, Sale, UserSettings } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  sales_count: number;
  total_revenue: number;
  low_stock_items: number;
  expiring_items: number;
  report_data: any;
  created_at: string;
  updated_at: string;
}

export const useDailyBackup = () => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<DailyReport[]>([]);

  const fetchReports = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setReports((data as DailyReport[]) || []);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const generateDailyReport = async (targetDate?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const today = targetDate || new Date().toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch today's sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          medicine:medicines(name, mrp, unit_type)
        `)
        .eq('user_id', user.id)
        .gte('sale_date', today)
        .lt('sale_date', tomorrowStr);

      if (salesError) throw salesError;

      // Fetch current medicines
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', user.id);

      if (medicinesError) throw medicinesError;

      // Fetch user settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      // Calculate metrics
      const totalRevenue = sales?.reduce((sum, sale) => {
        const medicine = sale.medicine as any;
        const unitPrice = medicine?.unit_type === 'strip' ? medicine.mrp : medicine.mrp / 10; // Assuming 10 tablets per strip default
        return sum + (sale.quantity_sold * unitPrice);
      }, 0) || 0;

      const lowStockThreshold = settings?.low_stock_threshold || 10;
      const criticalStockThreshold = settings?.critical_stock_threshold || 5;
      const expiryDays = settings?.expiry_alert_days || 30;

      const lowStockItems = medicines?.filter(medicine => {
        const totalTablets = medicine.strips * medicine.tablets_per_strip + medicine.remaining_tablets_in_current_strip;
        return totalTablets <= lowStockThreshold;
      }) || [];

      const expiringItems = medicines?.filter(medicine => {
        const expiryDate = new Date(medicine.expiry_date);
        const today = new Date();
        const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= expiryDays && daysDiff >= 0;
      }) || [];

      const reportData = {
        date: today,
        sales: sales || [],
        medicines: medicines || [],
        totalRevenue,
        salesCount: sales?.length || 0,
        lowStockItems,
        expiringItems,
        summary: {
          totalSales: sales?.length || 0,
          totalRevenue,
          lowStockCount: lowStockItems.length,
          expiringCount: expiringItems.length,
          totalMedicines: medicines?.length || 0
        }
      };

      // Save report to database
      const { data: reportRecord, error: reportError } = await supabase
        .from('daily_reports')
        .upsert({
          user_id: user.id,
          date: today,
          sales_count: sales?.length || 0,
          total_revenue: totalRevenue,
          low_stock_items: lowStockItems.length,
          expiring_items: expiringItems.length,
          report_data: reportData
        })
        .select()
        .single();

      if (reportError) throw reportError;

      if (reportError) throw reportError;

      await fetchReports();

      toast({
        title: "Daily Report Generated",
        description: `Report for ${today} created successfully`,
      });

      return reportData;
    } catch (error: any) {
      toast({
        title: "Report Generation Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const exportReportAsPDF = async (reportData: any) => {
    const doc = new jsPDF();
    const { date, summary, sales, lowStockItems, expiringItems } = reportData;

    // Header
    doc.setFontSize(20);
    doc.text(`Daily Report - ${date}`, 20, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text('Summary:', 20, 40);
    doc.text(`Total Sales: ${summary.totalSales}`, 20, 50);
    doc.text(`Total Revenue: $${summary.totalRevenue.toFixed(2)}`, 20, 60);
    doc.text(`Low Stock Items: ${summary.lowStockCount}`, 20, 70);
    doc.text(`Expiring Items: ${summary.expiringCount}`, 20, 80);

    // Sales table
    if (sales.length > 0) {
      const salesData = sales.map((sale: any) => [
        sale.medicine?.name || 'Unknown',
        sale.quantity_sold.toString(),
        sale.unit_type,
        new Date(sale.sale_date).toLocaleTimeString()
      ]);

      autoTable(doc, {
        head: [['Medicine', 'Quantity', 'Unit', 'Time']],
        body: salesData,
        startY: 90,
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    // Low stock alerts
    if (lowStockItems.length > 0) {
      const lowStockData = lowStockItems.map((item: Medicine) => [
        item.name,
        (item.strips * item.tablets_per_strip + item.remaining_tablets_in_current_strip).toString(),
        item.category || 'N/A'
      ]);

      const previousTable = (doc as any).lastAutoTable;
      autoTable(doc, {
        head: [['Medicine', 'Stock', 'Category']],
        body: lowStockData,
        startY: previousTable ? previousTable.finalY + 20 : 150,
        headStyles: { fillColor: [217, 83, 79] }
      });
    }

    // Save or share PDF
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReportAsExcel = async (reportData: any) => {
    const { date, summary, sales, lowStockItems, expiringItems } = reportData;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Date', date],
      ['Total Sales', summary.totalSales],
      ['Total Revenue', `$${summary.totalRevenue.toFixed(2)}`],
      ['Low Stock Items', summary.lowStockCount],
      ['Expiring Items', summary.expiringCount],
      ['Total Medicines', summary.totalMedicines]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sales sheet
    if (sales.length > 0) {
      const salesData = [
        ['Medicine', 'Quantity Sold', 'Unit Type', 'Sale Date', 'Sale Time'],
        ...sales.map((sale: any) => [
          sale.medicine?.name || 'Unknown',
          sale.quantity_sold,
          sale.unit_type,
          new Date(sale.sale_date).toLocaleDateString(),
          new Date(sale.sale_date).toLocaleTimeString()
        ])
      ];
      const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales');
    }

    // Low stock sheet
    if (lowStockItems.length > 0) {
      const lowStockData = [
        ['Medicine', 'Current Stock', 'Category', 'Expiry Date'],
        ...lowStockItems.map((item: Medicine) => [
          item.name,
          item.strips * item.tablets_per_strip + item.remaining_tablets_in_current_strip,
          item.category || 'N/A',
          item.expiry_date
        ])
      ];
      const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockData);
      XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Low Stock');
    }

    // Export
    XLSX.writeFile(workbook, `daily-report-${date}.xlsx`);
  };

  // Auto-generate daily report (call this on app startup)
  const checkAndGenerateDaily = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingReport = reports.find(r => r.date === today);
      
      if (!existingReport) {
        await generateDailyReport(today);
      }
    } catch (error) {
      console.error('Auto daily report generation failed:', error);
    }
  };

  return {
    loading,
    reports,
    generateDailyReport,
    exportReportAsPDF,
    exportReportAsExcel,
    checkAndGenerateDaily
  };
};