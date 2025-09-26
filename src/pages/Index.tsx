import { useState, useEffect } from 'react';
import { Medicine } from '@/types/medicine';
import { useMedicineStore } from '@/hooks/useMedicineStore';
import { MedicineCard } from '@/components/MedicineCard';
import { MedicineForm } from '@/components/MedicineForm';
import { SalesForm } from '@/components/SalesForm';
import { Dashboard } from '@/components/Dashboard';
import { Navigation, TabType } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pill } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [sellingMedicine, setSellingMedicine] = useState<Medicine | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const {
    medicines,
    sales,
    settings,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addSale,
    getStockInfo,
    getDailySales,
    updateSettings
  } = useMedicineStore();

  // Filter medicines based on search
  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => {
    const saleDate = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
    return saleDate.toISOString().split('T')[0] === today;
  });
  
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalValue, 0);
  const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.tabletsCount, 0);

  const handleSaveMedicine = (medicineData: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMedicine) {
      updateMedicine(editingMedicine.id, medicineData);
      toast({
        title: "Medicine updated",
        description: "Medicine information has been updated successfully.",
      });
    } else {
      addMedicine(medicineData);
      toast({
        title: "Medicine added",
        description: "New medicine has been added to inventory.",
      });
    }
    setShowMedicineForm(false);
    setEditingMedicine(null);
  };

  const handleDeleteMedicine = (id: string) => {
    const medicine = medicines.find(m => m.id === id);
    if (medicine && window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
      deleteMedicine(id);
      toast({
        title: "Medicine deleted",
        description: "Medicine has been removed from inventory.",
        variant: "destructive",
      });
    }
  };

  const handleSellMedicine = (tabletsCount: number) => {
    if (sellingMedicine) {
      const success = addSale(sellingMedicine.id, tabletsCount);
      if (success) {
        const totalValue = (tabletsCount * sellingMedicine.mrp) / sellingMedicine.tabletsPerStrip;
        toast({
          title: "Sale recorded",
          description: `Sold ${tabletsCount} tablets for ₹${totalValue.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Sale failed",
          description: "Not enough stock available.",
          variant: "destructive",
        });
      }
    }
    setShowSalesForm(false);
    setSellingMedicine(null);
  };

  const dailySalesData = getDailySales();

  const renderInventoryTab = () => (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Medicine Inventory</h1>
            <p className="opacity-90">Manage your medicine stock efficiently</p>
          </div>
          <Pill className="h-8 w-8 opacity-80" />
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="mobile"
          size="mobile"
          onClick={() => setShowMedicineForm(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Medicine List */}
      {filteredMedicines.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No medicines found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No medicines match your search.' : 'Add your first medicine to get started.'}
            </p>
            {!searchQuery && (
              <Button variant="mobile" onClick={() => setShowMedicineForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Medicine
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMedicines.map(medicine => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              stockInfo={getStockInfo(medicine)}
              onEdit={(med) => {
                setEditingMedicine(med);
                setShowMedicineForm(true);
              }}
              onDelete={handleDeleteMedicine}
              onSell={(med) => {
                setSellingMedicine(med);
                setShowSalesForm(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Reports & Analytics</h1>
        <p className="opacity-90">Track sales and inventory insights</p>
      </div>

      <Dashboard
        medicines={medicines}
        getStockInfo={getStockInfo}
        totalSalesValue={totalSalesValue}
        totalSalesToday={totalSalesToday}
      />

      {/* Sales History */}
      {dailySalesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailySalesData.slice(0, 5).map((dayData) => (
                <div key={dayData.date} className="border-b border-border pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {new Date(dayData.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {dayData.totalSales} tablets sold
                      </p>
                    </div>
                    <p className="font-semibold text-success">
                      ₹{dayData.totalValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="opacity-90">Configure your inventory preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Low Stock Threshold</Label>
            <Input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => updateSettings({
                ...settings,
                lowStockThreshold: Number(e.target.value)
              })}
              placeholder="20"
            />
            <p className="text-xs text-muted-foreground">
              Show warning when tablets fall below this number
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Critical Stock Threshold</Label>
            <Input
              type="number"
              value={settings.criticalStockThreshold}
              onChange={(e) => updateSettings({
                ...settings,
                criticalStockThreshold: Number(e.target.value)
              })}
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground">
              Show critical alert when tablets fall below this number
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'sales' && renderInventoryTab()} {/* Sales tab shows inventory with sell focus */}
        {activeTab === 'reports' && renderReportsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      {showMedicineForm && (
        <MedicineForm
          medicine={editingMedicine || undefined}
          onSave={handleSaveMedicine}
          onCancel={() => {
            setShowMedicineForm(false);
            setEditingMedicine(null);
          }}
        />
      )}

      {showSalesForm && sellingMedicine && (
        <SalesForm
          medicine={sellingMedicine}
          maxTablets={getStockInfo(sellingMedicine).totalTablets}
          onSale={handleSellMedicine}
          onCancel={() => {
            setShowSalesForm(false);
            setSellingMedicine(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
