import { useState } from 'react';
import { Medicine, UnitType } from '@/types/medicine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Package, Pill, Box } from 'lucide-react';

interface MedicineFormProps {
  medicine?: Medicine;
  onSave: (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function MedicineForm({ medicine, onSave, onCancel }: MedicineFormProps) {
  const [formData, setFormData] = useState({
    name: medicine?.name || '',
    mrp: medicine?.mrp || '',
    strips: medicine?.strips || '',
    tabletsPerStrip: medicine?.tabletsPerStrip || '',
    remainingTabletsInCurrentStrip: medicine?.remainingTabletsInCurrentStrip || 0,
    unitType: medicine?.unitType || 'strip',
    category: medicine?.category || 'medicine',
    customUnitName: medicine?.customUnitName || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }

    if (!formData.mrp || Number(formData.mrp) <= 0) {
      newErrors.mrp = 'Valid MRP is required';
    }

    if (!formData.strips || Number(formData.strips) < 0) {
      newErrors.strips = 'Number of strips must be 0 or greater';
    }

    if (!formData.tabletsPerStrip || Number(formData.tabletsPerStrip) <= 0) {
      newErrors.tabletsPerStrip = 'Tablets per strip must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave({
      name: formData.name.trim(),
      mrp: Number(formData.mrp),
      strips: Number(formData.strips),
      tabletsPerStrip: Number(formData.tabletsPerStrip),
      remainingTabletsInCurrentStrip: medicine?.remainingTabletsInCurrentStrip || 0,
      unitType: formData.unitType as UnitType,
      category: formData.category as 'medicine' | 'other',
      customUnitName: formData.customUnitName || undefined
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter medicine name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mrp">MRP per Strip (₹)</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => handleInputChange('mrp', e.target.value)}
                placeholder="0.00"
                className={errors.mrp ? 'border-destructive' : ''}
              />
              {errors.mrp && (
                <p className="text-sm text-destructive">{errors.mrp}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="strips">Number of Strips</Label>
              <Input
                id="strips"
                type="number"
                value={formData.strips}
                onChange={(e) => handleInputChange('strips', e.target.value)}
                placeholder="0"
                className={errors.strips ? 'border-destructive' : ''}
              />
              {errors.strips && (
                <p className="text-sm text-destructive">{errors.strips}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tabletsPerStrip">Tablets per Strip</Label>
              <Input
                id="tabletsPerStrip"
                type="number"
                value={formData.tabletsPerStrip}
                onChange={(e) => handleInputChange('tabletsPerStrip', e.target.value)}
                placeholder="0"
                className={errors.tabletsPerStrip ? 'border-destructive' : ''}
              />
              {errors.tabletsPerStrip && (
                <p className="text-sm text-destructive">{errors.tabletsPerStrip}</p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Item Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicine">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      <span>Medicine</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Other Item</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit Type Selection */}
            <div className="space-y-2">
              <Label>Default Unit Type</Label>
              <Select 
                value={formData.unitType} 
                onValueChange={(value) => handleInputChange('unitType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formData.category === 'medicine' ? (
                    <>
                      <SelectItem value="tablet">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          <span>Tablet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="strip">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Strip</span>
                        </div>
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pack">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Pack</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="box">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          <span>Box</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bottle">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Bottle</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="piece">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Piece</span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Unit Name for Non-Medicine Items */}
            {formData.category === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="customUnitName">Custom Unit Name (Optional)</Label>
                <Input
                  id="customUnitName"
                  value={formData.customUnitName}
                  onChange={(e) => handleInputChange('customUnitName', e.target.value)}
                  placeholder="e.g., chocolate bar, bottle"
                />
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
                variant="mobile"
                className="flex-1"
              >
                {medicine ? 'Update' : 'Add'} Medicine
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}