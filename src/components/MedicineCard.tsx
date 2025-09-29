import { Medicine, StockInfo, UnitType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, ShoppingCart, Package, Pill, Box, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedicineCardProps {
  medicine: Medicine;
  stockInfo: StockInfo;
  selectedUnitType: string;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
  onSell: (medicine: Medicine, unitType: string) => void;
  onUnitTypeChange: (medicineId: string, unitType: string) => void;
}

export function MedicineCard({ 
  medicine, 
  stockInfo, 
  selectedUnitType,
  onEdit, 
  onDelete, 
  onSell,
  onUnitTypeChange
}: MedicineCardProps) {
  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'tablet': return <Pill className="h-3 w-3" />;
      case 'strip': return <Package className="h-3 w-3" />;
      case 'pack': case 'box': return <Box className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const getUnitDisplay = (unit: string) => {
    if (medicine.custom_unit_name && unit !== 'tablet' && unit !== 'strip') {
      return medicine.custom_unit_name;
    }
    return unit;
  };

  const getAvailableUnits = (): string[] => {
    if (medicine.category === 'medicine') {
      return ['tablet', 'strip'];
    }
    const baseUnits: string[] = ['pack', 'box', 'bottle', 'piece'];
    return baseUnits;
  };

  const getCurrentStock = () => {
    switch (selectedUnitType) {
      case 'tablet':
        return stockInfo.totalTablets;
      case 'strip':
        return medicine.strips;
      default:
        return medicine.strips; // For other units, use strips as base
    }
  };

  const getCurrentMRP = () => {
    switch (selectedUnitType) {
      case 'tablet':
        return (medicine.mrp / medicine.tablets_per_strip).toFixed(2);
      case 'strip':
        return medicine.mrp.toFixed(2);
      default:
        return medicine.mrp.toFixed(2);
    }
  };

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
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {medicine.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>₹{getCurrentMRP()}</span>
              <span>per {getUnitDisplay(selectedUnitType)}</span>
              {medicine.category === 'other' && (
                <Badge variant="outline" className="text-xs">
                  {medicine.custom_unit_name || selectedUnitType}
                </Badge>
              )}
            </div>
            
            {/* Additional medicine info */}
            <div className="flex flex-wrap gap-2 mt-2">
              {medicine.barcode && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>{medicine.barcode}</span>
                </div>
              )}
              {medicine.expiry_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Exp: {new Date(medicine.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
              {medicine.batch_number && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  <span>Batch: {medicine.batch_number}</span>
                </div>
              )}
              {medicine.manufacturer && (
                <div className="text-xs text-muted-foreground">
                  <span>{medicine.manufacturer}</span>
                </div>
              )}
            </div>
          </div>
          {getStockBadge()}
        </div>
        
        {/* Unit Type Selector */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground">Unit:</span>
          <Select
            value={selectedUnitType}
            onValueChange={(value: string) => onUnitTypeChange(medicine.id, value)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
              <div className="flex items-center gap-1">
                {getUnitIcon(selectedUnitType)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {getAvailableUnits().map((unit) => (
                <SelectItem key={unit} value={unit}>
                  <div className="flex items-center gap-2">
                    {getUnitIcon(unit)}
                    <span className="capitalize">{getUnitDisplay(unit)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stock Information */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {selectedUnitType === 'tablet' ? 'Total Tablets' : selectedUnitType === 'strip' ? 'Strips Available' : 'Units Available'}
            </p>
            <p className="text-2xl font-bold text-card-foreground">
              {getCurrentStock()}
            </p>
          </div>
          {medicine.category === 'medicine' && selectedUnitType === 'tablet' && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Full Strips
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {medicine.strips}
              </p>
            </div>
          )}
          {medicine.category === 'medicine' && selectedUnitType === 'strip' && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Tablets
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {stockInfo.totalTablets}
              </p>
            </div>
          )}
        </div>

        {medicine.category === 'medicine' && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tablets per Strip
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {medicine.tablets_per_strip}
              </p>
            </div>
        )}

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
            onClick={() => onSell(medicine, selectedUnitType)}
            disabled={getCurrentStock() === 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sell {getUnitDisplay(selectedUnitType)}
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