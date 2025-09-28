import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, FileText, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFileImport, ImportResult } from '@/hooks/useFileImport';
import { Medicine } from '@/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ImportDialogProps {
  onImport: (data: Omit<Medicine, 'id' | 'created_at' | 'updated_at' | 'user_id'>[]) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ onImport }) => {
  const [open, setOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const { processImport, loading } = useFileImport();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await processImport(file);
    setImportResult(result);
    setStep('preview');
    event.target.value = '';
  };

  const confirmImport = () => {
    if (importResult?.success) {
      // Convert ImportRows to the expected format
      const convertedData = importResult.success.map(item => ({
        ...item,
        category: (item.category === 'medicine' || item.category === 'other') ? item.category : 'medicine' as 'medicine' | 'other'
      }));
      onImport(convertedData);
      toast({
        title: "Import Successful",
        description: `Imported ${importResult.success.length} medicines successfully`,
      });
      setOpen(false);
      resetDialog();
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setImportResult(null);
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Medicine Data</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="excel">Excel</TabsTrigger>
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
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Required columns: name, mrp, strips, tablets_per_strip
                </p>
                <p className="text-xs text-muted-foreground">
                  Optional: remaining_tablets_in_current_strip, expire_date, description, category, unit_type
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
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Required columns: name, mrp, strips, tablets_per_strip
                </p>
                <p className="text-xs text-muted-foreground">
                  Optional: remaining_tablets_in_current_strip, expire_date, description, category, unit_type
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'preview' && importResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Import Preview</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {importResult.success.length} Valid
                </Badge>
                {importResult.errors.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {importResult.errors.length} Errors
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded">
              <div className="p-4 space-y-4">
                {importResult.success.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Valid Records ({importResult.success.length})
                    </h4>
                    <div className="space-y-2">
                      {importResult.success.slice(0, 10).map((item, index) => (
                        <div key={index} className="border rounded p-2 bg-green-50">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            MRP: ₹{item.mrp} | Strips: {item.strips} | Tablets per strip: {item.tablets_per_strip}
                          </div>
                        </div>
                      ))}
                      {importResult.success.length > 10 && (
                        <div className="text-sm text-muted-foreground text-center">
                          ... and {importResult.success.length - 10} more valid records
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Invalid Records ({importResult.errors.length})
                    </h4>
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="border border-red-200 rounded p-2 bg-red-50">
                          <div className="font-medium text-red-700">Row {error.row}</div>
                          <div className="text-sm text-red-600">{error.error}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Data: {JSON.stringify(error.data)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <Button 
                onClick={confirmImport}
                disabled={importResult.success.length === 0}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Import {importResult.success.length} Records
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};