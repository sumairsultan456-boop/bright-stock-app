import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterOptions {
  category: 'all' | 'medicine' | 'other';
  stockLevel: 'all' | 'good' | 'low' | 'critical';
  sortBy: 'name' | 'stock' | 'expiry' | 'category';
  sortOrder: 'asc' | 'desc';
  showExpiringSoon: boolean;
  showLowStock: boolean;
}

interface FilterDialogProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({ filters, onChange }) => {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const handleApply = () => {
    onChange(tempFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      category: 'all',
      stockLevel: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      showExpiringSoon: false,
      showLowStock: false
    };
    setTempFilters(defaultFilters);
    onChange(defaultFilters);
    setOpen(false);
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter & Sort</DialogTitle>
          <DialogDescription>
            Customize how your medicines are displayed
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={tempFilters.category} 
              onValueChange={(value) => updateFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="medicine">Medicines Only</SelectItem>
                <SelectItem value="other">Other Items Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stock Level</Label>
            <Select 
              value={tempFilters.stockLevel} 
              onValueChange={(value) => updateFilter('stockLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="good">Good Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical/Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <div className="flex gap-2">
              <Select 
                value={tempFilters.sortBy} 
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stock">Stock Level</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={tempFilters.sortOrder} 
                onValueChange={(value) => updateFilter('sortOrder', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">A-Z</SelectItem>
                  <SelectItem value="desc">Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Quick Filters</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lowStock" 
                  checked={tempFilters.showLowStock}
                  onCheckedChange={(checked) => updateFilter('showLowStock', checked)}
                />
                <Label htmlFor="lowStock" className="text-sm">Show only low stock items</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="expiring" 
                  checked={tempFilters.showExpiringSoon}
                  onCheckedChange={(checked) => updateFilter('showExpiringSoon', checked)}
                />
                <Label htmlFor="expiring" className="text-sm">Show only expiring soon</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};