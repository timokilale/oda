const NAV_ITEMS = [
  { id: 'orders', label: 'Orders' },
  { id: 'menu', label: 'Menu' },
  { id: 'tables', label: 'Tables' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export default function RestomanageHeader({
  activeTab,
  onTabChange,
  restaurantName = 'Restaurant',
  branchName = '',
  imageUrl,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 w-full bg-white/80 dark:bg-[#191c1d]/80 border-b border-[#E5E7EB] dark:border-neutral-800">
      <div className="flex items-center gap-1 md:gap-2">
        <div className="hidden md:flex items-center gap-2 mr-3 pr-3 border-r border-[#E5E7EB] dark:border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 dark:bg-white flex items-center justify-center text-white dark:text-neutral-800 font-sans text-xs font-bold overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              'O'
            )}
          </div>
          <div className="hidden lg:block">
            <span className="font-sans text-sm font-semibold text-neutral-800 dark:text-neutral-100 leading-tight block">{restaurantName}</span>
            <span className="font-sans text-[10px] text-neutral-400 leading-tight block">{branchName}</span>
          </div>
        </div>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-lg font-sans text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          className="px-3 py-2 text-xs font-sans font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
