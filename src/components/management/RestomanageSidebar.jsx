const NAV_ITEMS = [
  { id: 'orders', label: 'Orders' },
  { id: 'menu', label: 'Menu' },
  { id: 'tables', label: 'Tables' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export default function RestomanageSidebar({
  activeTab,
  onTabChange,
}) {
  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-[#E5E7EB] flex items-center justify-around py-2.5 px-4">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`text-[10px] font-sans font-medium transition-all ${
              isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </footer>
  );
}
