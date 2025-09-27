import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, FileText, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImportDialogProps {
  onImport: (data: any[]) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ onImport }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'excel') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    try {
      // For now, just show a placeholder message
      toast({
        title: "Import Feature",
        description: "File import functionality will be implemented soon. This feature requires document parsing capabilities.",
      });
      
      // Reset the input
      event.target.value = '';
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEntry = () => {
    toast({
      title: "Bulk Entry",
      description: "Manual bulk entry form will be available soon.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Medicine Data</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="excel">Excel</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mb-2" />
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <span className="font-medium">Click to upload CSV file</span>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  disabled={loading}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                CSV format: Name, MRP, Strips, Tablets per Strip, Category
              </p>
            </div>
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground mb-2" />
              <Label htmlFor="excel-upload" className="cursor-pointer">
                <span className="font-medium">Click to upload Excel file</span>
                <Input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, 'excel')}
                  disabled={loading}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Excel format: Name, MRP, Strips, Tablets per Strip, Category
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Database className="w-8 h-8 text-muted-foreground mb-2" />
              <Button onClick={handleBulkEntry} disabled={loading}>
                Open Bulk Entry Form
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Manually enter multiple medicines at once
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};