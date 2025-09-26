import { Pill, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'inventory' | 'sales' | 'reports' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'inventory' as const, label: 'Medicines', icon: Pill },
  { id: 'sales' as const, label: 'Sales', icon: ShoppingCart },
  { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
  { id: 'settings' as const, label: 'Settings', icon: Settings }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="bg-card border-t border-border sticky bottom-0 z-40">
      <nav className="flex items-center justify-around">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1",
              "text-xs font-medium transition-all duration-200",
              "hover:bg-accent/50 active:scale-95",
              activeTab === id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 mb-1 transition-transform",
              activeTab === id && "scale-110"
            )} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}