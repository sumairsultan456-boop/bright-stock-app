import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Mail, MessageCircle, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDailyBackup } from '@/hooks/useDailyBackup';
import { useSupabaseMedicines } from '@/hooks/useSupabaseMedicines';
import { Share } from '@capacitor/share';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [format, setFormat] = useState<'pdf' | 'excel'>('excel');
  const [loading, setLoading] = useState(false);
  
  const { generateDailyReport, exportReportAsPDF, exportReportAsExcel } = useDailyBackup();
  const { medicines, sales, getStockInfo, settings } = useSupabaseMedicines();

  const handleExport = async () => {
    setLoading(true);
    try {
      let reportData;
      
      if (exportType === 'today') {
        reportData = await generateDailyReport();
      } else {
        // Generate comprehensive report
        const lowStockThreshold = settings?.low_stock_threshold || 10;
        const expiryDays = settings?.expiry_alert_days || 30;
        
        const lowStockItems = medicines.filter(medicine => {
          const stockInfo = getStockInfo(medicine);
          return stockInfo.totalTablets <= lowStockThreshold;
        });

        const expiringItems = medicines.filter(medicine => {
          if (!medicine.expiry_date) return false;
          const expiryDate = new Date(medicine.expiry_date);
          const today = new Date();
          const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= expiryDays && daysDiff >= 0;
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
        
        reportData = {
          date: new Date().toISOString().split('T')[0],
          medicines: medicines.map(med => ({
            ...med,
            stockInfo: getStockInfo(med),
            barcode: med.barcode || 'N/A'
          })),
          sales,
          lowStockItems,
          expiringItems,
          summary: {
            totalSales: sales.length,
            totalRevenue,
            lowStockCount: lowStockItems.length,
            expiringCount: expiringItems.length,
            totalMedicines: medicines.length
          }
        };
      }

      if (format === 'pdf') {
        await exportReportAsPDF(reportData);
      } else {
        await exportReportAsExcel(reportData);
      }

      toast({
        title: "Export Successful",
        description: `Report exported as ${format.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Medicine Inventory Report',
        text: 'Here is the latest inventory report from MediTrack Pro',
        dialogTitle: 'Share Report'
      });
    } catch (error) {
      console.log('Share failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Generate and download your inventory and sales report
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={exportType} onValueChange={(value) => setExportType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today's Report</SelectItem>
                <SelectItem value="week">Full Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={(value) => setFormat(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Report includes:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Product names and barcodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Current stock levels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Sales data and revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full"></div>
                <span>Low stock and expiry alerts</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};