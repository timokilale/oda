import RestomanageHeader from './RestomanageHeader';
import RestomanageSidebar from './RestomanageSidebar';
import { ToastProvider } from '../../context/ToastContext.jsx';

export default function RestomanageShell({
  currentSection,
  onSectionChange,
  restaurant,
  onLogout,
  children,
}) {
  return (
    <div className="restomanage-theme bg-[#f8f9fa] dark:bg-[#191c1d] dark:text-white text-[#191c1d] min-h-screen flex flex-col font-sans">
      <RestomanageHeader
        activeTab={currentSection}
        onTabChange={onSectionChange}
        restaurantName={restaurant?.name}
        branchName={restaurant?.city || restaurant?.branch || 'Main Branch'}
        onLogout={onLogout}
      />

      <ToastProvider>
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </ToastProvider>

      <RestomanageSidebar
        activeTab={currentSection}
        onTabChange={onSectionChange}
      />
    </div>
  );
}
