import { Receipt, UtensilsCrossed, Table as TableIcon, BarChart3, Settings, LogOut, Store } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'tables', label: 'Tables', icon: TableIcon },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function RestomanageHeader({
  activeTab,
  onTabChange,
  restaurantName = 'Restaurant',
  branchName = '',
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 w-full bg-white/80 dark:bg-[#191c1d]/80 frosted-header border-b border-[#E5E7EB] dark:border-neutral-800">
      <div className="flex items-center gap-1 md:gap-2">
        <div className="hidden md:flex items-center gap-2 mr-3 pr-3 border-r border-[#E5E7EB] dark:border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-[#4338ca] flex items-center justify-center text-white">
            <Store className="w-4 h-4" />
          </div>
          <div className="hidden lg:block">
            <span className="font-sans text-sm font-bold text-[#2a14b4] dark:text-[#c3c0ff] leading-tight block">{restaurantName}</span>
            <span className="font-sans text-[10px] text-[#5b598c] dark:text-neutral-400 leading-tight block">{branchName}</span>
          </div>
        </div>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-sans text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#4338ca] text-white shadow-sm'
                    : 'text-[#5b598c] hover:bg-[#e7e8e9] dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#edeeef] dark:hover:bg-neutral-800 transition-colors text-neutral-400"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
