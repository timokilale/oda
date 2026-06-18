import { useState } from 'react';
import RestomanageHeader from './RestomanageHeader';
import RestomanageSidebar from './RestomanageSidebar';

const SECTION_TITLES = {
  orders: 'Live Orders',
  menu: 'Menu Management',
  tables: 'Table Management',
  reports: 'Reports & Analytics',
  settings: 'Branch Settings',
};

export default function RestomanageShell({
  currentSection,
  onSectionChange,
  restaurant,
  soundEnabled,
  onToggleSound,
  notificationsCount,
  onNotificationsClick,
  onLogout,
  children,
}) {
  const [ordersActive, setOrdersActive] = useState(restaurant?.active ?? true);

  return (
    <div className="restomanage-theme bg-[#f8f9fa] dark:bg-[#191c1d] dark:text-white text-[#191c1d] min-h-screen flex font-sans">
      <RestomanageSidebar
        activeTab={currentSection}
        onTabChange={onSectionChange}
        restaurantName={restaurant?.name}
        branchName={restaurant?.city || restaurant?.branch || 'Main Branch'}
        onLogout={onLogout}
      />

      <main className="flex-grow md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <RestomanageHeader
          title={SECTION_TITLES[currentSection] || 'Dashboard'}
          ordersActive={ordersActive}
          onToggleOrders={() => setOrdersActive((v) => !v)}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          notificationsCount={notificationsCount}
          onNotificationsClick={onNotificationsClick}
        />

        <section className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {children}
        </section>
      </main>
    </div>
  );
}
