import { Medicine, StockInfo } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicineCardProps {
  medicine: Medicine;
  stockInfo: StockInfo;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
  onSell: (medicine: Medicine) => void;
}

export function MedicineCard({ 
  medicine, 
  stockInfo, 
  onEdit, 
  onDelete, 
  onSell 
}: MedicineCardProps) {
  const getStockBadge = () => {
    const baseClasses = "stock-indicator";
    
    switch (stockInfo.level) {
      case 'good':
        return <Badge className={cn(baseClasses, "stock-good")}>In Stock</Badge>;
      case 'low':
        return <Badge className={cn(baseClasses, "stock-low")}>Low Stock</Badge>;
      case 'critical':
        return <Badge className={cn(baseClasses, "stock-critical")}>Critical</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="medicine-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {medicine.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              ₹{medicine.mrp} per strip
            </p>
          </div>
          {getStockBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stock Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Strips Available
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {medicine.strips}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Tablets
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {stockInfo.totalTablets}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tablets per Strip
          </p>
          <p className="text-lg font-semibold text-card-foreground">
            {medicine.tabletsPerStrip}
          </p>
        </div>

        {/* Stock Status Message */}
        <div className={cn(
          "p-3 rounded-lg text-sm font-medium",
          stockInfo.level === 'good' && "bg-success/10 text-success border border-success/20",
          stockInfo.level === 'low' && "bg-warning/10 text-warning border border-warning/20",
          stockInfo.level === 'critical' && "bg-danger/10 text-danger border border-danger/20"
        )}>
          {stockInfo.message}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="mobile"
            size="sm"
            onClick={() => onSell(medicine)}
            disabled={stockInfo.totalTablets === 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sell
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(medicine)}
            className="px-3"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(medicine.id)}
            className="px-3 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}