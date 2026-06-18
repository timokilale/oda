import { Receipt, UtensilsCrossed, Table as TableIcon, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'tables', label: 'Tables', icon: TableIcon },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function RestomanageSidebar({
  activeTab,
  onTabChange,
}) {
  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-[#E5E7EB] flex items-center justify-around py-2.5 px-4">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-95 ${
              isActive ? 'text-[#2a14b4] dark:text-[#c3c0ff]' : 'text-neutral-500'
            }`}
          >
            <IconComponent className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold tracking-tight uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </footer>
  );
}
