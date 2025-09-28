import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, ScanLine } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const startScan = async () => {
    setScanning(true);
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      // For now, we'll simulate barcode detection
      // In a real implementation, you'd use a barcode detection library
      if (image.dataUrl) {
        // Simulate a scanned barcode result
        const mockBarcode = `MED${Math.random().toString().substring(2, 8)}`;
        onScan(mockBarcode);
        toast({
          title: "Barcode Scanned",
          description: `Scanned: ${mockBarcode}`,
        });
        setOpen(false);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please check permissions.",
          variant: "destructive",
        });
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ScanLine className="w-4 h-4 mr-2" />
          Scan Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Scanner</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Use your camera to scan a barcode for quick medicine lookup
            </p>
            
            <Button 
              onClick={startScan} 
              disabled={scanning}
              className="w-full"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanning
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            <p>• Make sure the barcode is clearly visible</p>
            <p>• Hold steady until the scan completes</p>
            <p>• Good lighting improves scan accuracy</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};