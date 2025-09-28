import { Medicine, StockInfo } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingUp, IndianRupee } from 'lucide-react';

interface DashboardProps {
  medicines: Medicine[];
  getStockInfo: (medicine: Medicine) => StockInfo;
  totalSalesValue: number;
  totalSalesToday: number;
}

export function Dashboard({ 
  medicines, 
  getStockInfo, 
  totalSalesValue, 
  totalSalesToday 
}: DashboardProps) {
  const lowStockMedicines = medicines.filter(medicine => {
    const stockInfo = getStockInfo(medicine);
    return stockInfo.level === 'low' || stockInfo.level === 'critical';
  });

  const outOfStockCount = medicines.filter(medicine => {
    const stockInfo = getStockInfo(medicine);
    return stockInfo.totalTablets === 0;
  }).length;

  const totalMedicines = medicines.length;
  const totalTablets = medicines.reduce((sum, medicine) => {
    const stockInfo = getStockInfo(medicine);
    return sum + stockInfo.totalTablets;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Medicines
                </p>
                <p className="text-2xl font-bold">{totalMedicines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tablets
                </p>
                <p className="text-2xl font-bold">{totalTablets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Sales Value
                </p>
                <p className="text-2xl font-bold">₹{totalSalesValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Sales
                </p>
                <p className="text-2xl font-bold">{totalSalesToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      {(outOfStockCount > 0 || lowStockMedicines.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-danger/10 border border-danger/20 rounded-lg">
                <div>
                  <p className="font-medium text-danger">Out of Stock</p>
                  <p className="text-sm text-danger/80">
                    {outOfStockCount} medicine{outOfStockCount > 1 ? 's' : ''} need restocking
                  </p>
                </div>
                <Badge className="stock-critical">
                  {outOfStockCount}
                </Badge>
              </div>
            )}

            {lowStockMedicines.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-warning">Low Stock Items:</p>
                <div className="space-y-2">
                  {lowStockMedicines.slice(0, 3).map(medicine => {
                    const stockInfo = getStockInfo(medicine);
                    return (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-2 bg-warning/5 border border-warning/20 rounded"
                      >
                        <span className="text-sm font-medium">{medicine.name}</span>
                        <Badge className={
                          stockInfo.level === 'critical' ? 'stock-critical' : 'stock-low'
                        }>
                          {stockInfo.totalTablets} tablets
                        </Badge>
                      </div>
                    );
                  })}
                  {lowStockMedicines.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{lowStockMedicines.length - 3} more items need attention
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">In Stock:</span>
              <span className="font-medium text-success">
                {medicines.length - lowStockMedicines.length - outOfStockCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Low Stock:</span>
              <span className="font-medium text-warning">
                {lowStockMedicines.length - outOfStockCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Out of Stock:</span>
              <span className="font-medium text-danger">{outOfStockCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}