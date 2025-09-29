import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Settings, 
  BarChart3, 
  Package2, 
  User,
  LogOut,
  Moon,
  Sun,
  Bell,
  Filter,
  Upload,
  Download,
  ScanLine
} from 'lucide-react';
import { Navigation, TabType } from '@/components/Navigation';
import { AlphabetNavigator } from '@/components/AlphabetNavigator';
import { MedicineCard } from '@/components/MedicineCard';
import { MedicineForm } from '@/components/MedicineForm';
import { SalesForm } from '@/components/SalesForm';
import { Dashboard } from '@/components/Dashboard';
import { ImportDialog } from '@/components/ImportDialog';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { ReportsDialog } from '@/components/ReportsDialog';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ExportDialog } from '@/components/ExportDialog';
import { FilterDialog, FilterOptions } from '@/components/FilterDialog';
import { useDailyBackup } from '@/hooks/useDailyBackup';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseMedicines } from '@/hooks/useSupabaseMedicines';
import { Medicine, DailySales } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<Record<string, string>>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    stockLevel: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    showExpiringSoon: false,
    showLowStock: false
  });

  const { user, signOut } = useAuth();
  const {
    medicines,
    sales,
    settings,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addSale,
    getStockInfo,
    updateSettings
  } = useSupabaseMedicines();

  // Filter and sort medicines
  const filteredMedicines = medicines
    .filter(medicine => {
      // Text search
      const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (medicine.barcode && medicine.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category filter
      const matchesCategory = filters.category === 'all' || medicine.category === filters.category;
      
      // Stock level filter
      let matchesStockLevel = true;
      if (filters.stockLevel !== 'all') {
        const stockInfo = getStockInfo(medicine);
        matchesStockLevel = stockInfo.level === filters.stockLevel;
      }
      
      // Quick filters
      let matchesQuickFilters = true;
      if (filters.showLowStock || filters.showExpiringSoon) {
        const stockInfo = getStockInfo(medicine);
        const isLowStock = stockInfo.level === 'low' || stockInfo.level === 'critical';
        
        let isExpiring = false;
        if (medicine.expiry_date) {
          const expiryDate = new Date(medicine.expiry_date);
          const today = new Date();
          const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          isExpiring = daysDiff <= (settings?.expiry_alert_days || 30) && daysDiff >= 0;
        }
        
        matchesQuickFilters = (!filters.showLowStock || isLowStock) && 
                            (!filters.showExpiringSoon || isExpiring);
      }
      
      return matchesSearch && matchesCategory && matchesStockLevel && matchesQuickFilters;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'stock':
          const stockA = getStockInfo(a).totalTablets;
          const stockB = getStockInfo(b).totalTablets;
          comparison = stockA - stockB;
          break;
        case 'expiry':
          const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
          const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleLetterSelect = (letter: string) => {
    const element = document.getElementById(`medicine-${letter}`);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveMedicine = async (medicineData: Omit<Medicine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, medicineData);
      } else {
        await addMedicine(medicineData);
      }
      setShowMedicineForm(false);
      setEditingMedicine(null);
    } catch (error) {
      console.error('Error saving medicine:', error);
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(medicineId);
      } catch (error) {
        console.error('Error deleting medicine:', error);
      }
    }
  };

  const handleSellMedicine = async (medicine: Medicine, unitType: string, quantity: number) => {
    try {
      await addSale(medicine.id, unitType, quantity);
      setShowSalesForm(false);
      setSelectedMedicine(null);
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const handleUnitTypeChange = (medicineId: string, unitType: string) => {
    setSelectedUnitTypes(prev => ({
      ...prev,
      [medicineId]: unitType
    }));
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Search for medicine by barcode
    const foundMedicine = medicines.find(m => m.barcode === barcode);
    if (foundMedicine) {
      setSelectedMedicine(foundMedicine);
      setShowSalesForm(true);
      setShowBarcodeScanner(false);
      toast({
        title: "Product Found",
        description: `Found ${foundMedicine.name}. Ready to add to sale.`,
      });
    } else {
      // No medicine found with this barcode - offer to add new product
      toast({
        title: "Product Not Found",
        description: `No product found with barcode ${barcode}. Opening form to add new product.`,
      });
      setEditingMedicine({ barcode } as Medicine); // Pre-fill barcode
      setShowMedicineForm(true);
      setShowBarcodeScanner(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate totals for dashboard
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString();
    const saleDate = new Date(sale.sale_date).toDateString();
    return today === saleDate;
  });
  const totalSalesToday = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Group medicines by first letter for alphabet navigation
  const medicinesByLetter = filteredMedicines.reduce((acc, medicine) => {
    const letter = medicine.name[0]?.toUpperCase() || '#';
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(medicine);
    return acc;
  }, {} as Record<string, Medicine[]>);

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterDialog filters={filters} onChange={setFilters} />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBarcodeScanner(true)}
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Scan
          </Button>
          <ImportDialog onImport={() => {}} />
          <Button 
            onClick={() => setShowMedicineForm(true)}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="grid gap-4">
            {Object.entries(medicinesByLetter).map(([letter, medicines]) => (
              <div key={letter} id={`medicine-${letter}`}>
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-4 border-b">
                  <h3 className="text-lg font-semibold text-foreground">{letter}</h3>
                </div>
                <div className="grid gap-4">
                  {medicines.map((medicine) => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                      stockInfo={getStockInfo(medicine)}
                      selectedUnitType={selectedUnitTypes[medicine.id] || medicine.unit_type}
                      onEdit={(medicine) => {
                        setEditingMedicine(medicine);
                        setShowMedicineForm(true);
                      }}
                      onDelete={handleDeleteMedicine}
                      onSell={(medicine, unitType) => {
                        setSelectedMedicine(medicine);
                        setSelectedUnitTypes(prev => ({ ...prev, [medicine.id]: unitType }));
                        setShowSalesForm(true);
                      }}
                      onUnitTypeChange={handleUnitTypeChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredMedicines.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-center mb-2">No medicines found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery 
                    ? `No medicines match "${searchQuery}". Try a different search term.`
                    : "Get started by adding your first medicine to the inventory."
                  }
                </p>
                <Button onClick={() => setShowMedicineForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medicine
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="hidden lg:block">
          <AlphabetNavigator 
            medicines={filteredMedicines}
            onLetterSelect={handleLetterSelect}
          />
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <Dashboard 
        medicines={medicines}
        getStockInfo={getStockInfo}
        totalSalesValue={totalSalesValue}
        totalSalesToday={totalSalesToday}
      />
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download your inventory and sales data</CardDescription>
          </div>
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{medicines.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">₹{totalSalesToday.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest transactions in your store</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{sale.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.quantity_sold} {sale.unit_type}(s) × ₹{sale.unit_price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{sale.total_amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No sales recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </div>
            <ThemeToggle />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">User ID</p>
              <p className="text-sm text-muted-foreground font-mono">{user?.id?.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>Configure when to receive low stock alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Low Stock Threshold</label>
              <Input 
                type="number" 
                value={settings?.low_stock_threshold || 10}
                onChange={(e) => updateSettings({ low_stock_threshold: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Critical Stock Threshold</label>
              <Input 
                type="number" 
                value={settings?.critical_stock_threshold || 5}
                onChange={(e) => updateSettings({ critical_stock_threshold: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Package2 className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">MediTrack Pro</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="mt-6">
            <TabsContent value="inventory">{renderInventoryTab()}</TabsContent>
            <TabsContent value="reports">{renderReportsTab()}</TabsContent>
            <TabsContent value="settings">{renderSettingsTab()}</TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Medicine Form Modal */}
      {showMedicineForm && (
        <MedicineForm
          medicine={editingMedicine}
          onSave={handleSaveMedicine}
          onCancel={() => {
            setShowMedicineForm(false);
            setEditingMedicine(null);
          }}
        />
      )}

      {/* Sales Form Modal */}
      {showSalesForm && selectedMedicine && (
        <SalesForm
          medicine={selectedMedicine}
          maxTablets={getStockInfo(selectedMedicine).totalTablets}
          onSale={(quantity) => handleSellMedicine(
            selectedMedicine, 
            selectedUnitTypes[selectedMedicine.id] || selectedMedicine.unit_type, 
            quantity
          )}
          onCancel={() => {
            setShowSalesForm(false);
            setSelectedMedicine(null);
          }}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
      />

      {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <BarcodeScanner 
              onScan={(barcode) => {
                handleBarcodeScanned(barcode);
                setShowBarcodeScanner(false);
              }}
              onMedicineFound={(medicine) => {
                setSelectedMedicine(medicine);
                setShowSalesForm(true);
                setShowBarcodeScanner(false);
              }}
            />
            <Button 
              variant="outline" 
              onClick={() => setShowBarcodeScanner(false)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;