import { useState } from 'react';
import { Medicine } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart } from 'lucide-react';

interface SalesFormProps {
  medicine: Medicine;
  maxTablets: number;
  onSale: (tabletsCount: number) => void;
  onCancel: () => void;
}

export function SalesForm({ medicine, maxTablets, onSale, onCancel }: SalesFormProps) {
  const [tabletsCount, setTabletsCount] = useState('');
  const [error, setError] = useState('');

  const validateSale = () => {
    const count = Number(tabletsCount);
    
    if (!tabletsCount || count <= 0) {
      setError('Please enter a valid number of tablets');
      return false;
    }

    if (count > maxTablets) {
      setError(`Only ${maxTablets} tablets available`);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSale()) return;
    
    onSale(Number(tabletsCount));
  };

  const handleInputChange = (value: string) => {
    setTabletsCount(value);
    if (error) setError('');
  };

  const calculateTotal = () => {
    const count = Number(tabletsCount) || 0;
    const pricePerTablet = medicine.mrp / medicine.tabletsPerStrip;
    return (count * pricePerTablet).toFixed(2);
  };

  const quickSellOptions = [1, 5, 10, medicine.tabletsPerStrip].filter(
    (option) => option <= maxTablets
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Sell Medicine
            </CardTitle>
            <p className="text-sm text-muted-foreground">{medicine.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Medicine Info */}
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available Stock:</span>
              <Badge variant="outline" className="font-semibold">
                {maxTablets} tablets
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Price per Tablet:</span>
              <span className="text-sm font-semibold">
                ₹{(medicine.mrp / medicine.tabletsPerStrip).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Sell Options */}
          {quickSellOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Select:</Label>
              <div className="flex gap-2 flex-wrap">
                {quickSellOptions.map((count) => (
                  <Button
                    key={count}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange(count.toString())}
                    className="text-xs"
                  >
                    {count} {count === medicine.tabletsPerStrip ? 'strip' : 'tablets'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tabletsCount">Number of Tablets to Sell</Label>
              <Input
                id="tabletsCount"
                type="number"
                min="1"
                max={maxTablets}
                value={tabletsCount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter number of tablets"
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Total Calculation */}
            {tabletsCount && !error && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    ₹{calculateTotal()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="mobile-success"
                className="flex-1"
                disabled={!tabletsCount || !!error}
              >
                Complete Sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}