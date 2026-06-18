import { 
  Receipt, 
  UtensilsCrossed, 
  Table as TableIcon, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Store 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branchName?: string;
  restaurantName?: string;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  branchName = 'Main Street Branch', 
  restaurantName = 'Bistro Modern' 
}: SidebarProps) {
  
  const navItems = [
    { id: 'orders', label: 'Orders', icon: Receipt },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'tables', label: 'Tables', icon: TableIcon },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[#E5E7EB] bg-[#f3f4f5] dark:bg-neutral-900 w-64 z-40">
        {/* Branch Title & Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4338ca] flex items-center justify-center text-white shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold text-[#2a14b4] dark:text-[#c3c0ff]">
              {restaurantName}
            </h1>
            <p className="font-sans text-xs text-[#5b598c] dark:text-neutral-400">
              {branchName}
            </p>
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-grow px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-150 active:scale-98 text-left ${
                  isActive
                    ? 'bg-[#4338ca] text-white shadow-sm'
                    : 'text-[#5b598c] hover:bg-[#e7e8e9] dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#5b598c] dark:text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-4 border-t border-[#E5E7EB] mt-auto">
          <button
            id="sidebar-item-help"
            onClick={() => alert('Support portal is loading... Our Bistro specialist will contact you shortly.')}
            className="w-full text-[#5b598c] dark:text-neutral-300 flex items-center gap-3 px-4 py-2 hover:bg-[#e7e8e9] dark:hover:bg-neutral-800 transition-all rounded-lg font-sans text-sm text-left active:scale-98 mb-1"
          >
            <HelpCircle className="w-5 h-5 text-[#5b598c] dark:text-neutral-400" />
            <span>Help</span>
          </button>
          <button
            id="sidebar-item-logout"
            onClick={() => {
              if (confirm('Are you sure you want to log out of Bistro Admin?')) {
                alert('Session closed safely.');
              }
            }}
            className="w-full text-[#5b598c] dark:text-neutral-300 flex items-center gap-3 px-4 py-2 hover:bg-[#e7e8e9] dark:hover:bg-neutral-800 transition-all rounded-lg font-sans text-sm text-left active:scale-98"
          >
            <LogOut className="w-5 h-5 text-[#5b598c] dark:text-neutral-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-[#E5E7EB] flex items-center justify-around py-2.5 px-4">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
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
    </>
  );
}
