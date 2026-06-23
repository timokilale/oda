import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, ReceiptText, ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
import usePublicOrder from '../hooks/usePublicOrder';
import MenuSwiper from '../components/public-order/MenuSwiper';
import DishDetailModal from '../components/public-order/DishDetailModal';
import OrderStatusPanel from '../components/public-order/OrderStatusPanel';

function DesktopNotice() {
  return (
    <div className="min-h-dvh bg-background hidden sm:flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary">
            <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Open on your phone</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Scan the QR code at your table with your phone camera to browse the menu and order.
        </p>
      </div>
    </div>
  );
}

export default function PublicOrderPage() {
  const { restaurantRef } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '';

  const {
    context, loading, lookupError,
    menuItems, menuIsReady,
    activeTab, setActiveTab,
    swiperIndex, setSwiperIndex,
    detailItem, setDetailItem,
    toastMessage,
    cart, cartQuantities, cartPlatesTotalCount,
    handleAddItem, handleRemoveCartItem, handleClearCart,
    activeOrders, completedOrders,
    submitting, handlePlaceOrder,
  } = usePublicOrder(restaurantRef, tableNumber);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map((i) => i.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [menuItems]);

  // Reset swiper index when category changes to avoid out-of-bounds
  useEffect(() => { setSwiperIndex(0); }, [selectedCategory, setSwiperIndex]);
  const filteredMenuItems = useMemo(() => {
    return selectedCategory === 'All'
      ? menuItems
      : menuItems.filter((i) => i.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  if (!tableNumber) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">No table specified.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Getting the menu ready for table {tableNumber}...</p>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-container-margin">
          <p className="font-label-caps text-label-caps text-destructive mb-2">Connection issue</p>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Couldn't load menu</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">{lookupError}</p>
        </div>
      </div>
    );
  }

  if (!menuIsReady) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-container-margin">
          <p className="font-label-caps text-label-caps text-primary mb-2">Menu unavailable</p>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">This menu is empty</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Ask staff to add items, then refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DesktopNotice />
      <div className="fixed inset-0 bg-background text-on-surface antialiased flex flex-col sm:hidden [&_*]:!border-transparent">
        {/* Ambient glow — Android dialer-style color radiance */}
        <div
          key={filteredMenuItems[swiperIndex]?.id || 'none'}
          className="absolute inset-0 pointer-events-none z-0 transition-colors duration-700"
          style={{
            background: filteredMenuItems[swiperIndex]?.colorLeak
              ? `radial-gradient(ellipse at 50% 30%, ${filteredMenuItems[swiperIndex].colorLeak}cc 0%, ${filteredMenuItems[swiperIndex].colorLeak}44 50%, transparent 75%)`
              : 'none',
          }}
        />

        {/* Header */}
        <header className="relative z-40 bg-surface/90 backdrop-blur-xl flex justify-between items-end px-5 pt-4 pb-3 h-18 shrink-0 select-none">
          <div className="flex items-center pb-0.5">
            {activeTab === 'status' ? (
              <button
                onClick={() => setActiveTab('menu')}
                className="p-1.5 -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-all active:scale-90"
                aria-label="Back to menu"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] font-black opacity-60 text-secondary">
              {context?.restaurant?.name || 'ODA'}
            </span>
            {activeTab === 'menu' ? (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-transparent font-serif italic text-lg leading-tight mt-0.5 text-on-surface font-semibold text-center pr-5 focus:outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/60" />
              </div>
            ) : (
              <h1 className="font-serif italic text-lg leading-tight mt-0.5 text-on-surface font-semibold">
                {activeOrders.length > 0 ? 'Order Status' : 'Cart'}
              </h1>
            )}
          </div>

          <div className="w-8 pb-0.5" />
        </header>

        {/* Body */}
        <main className="flex-1 overflow-hidden flex flex-col relative z-10">
          {activeTab === 'menu' && (
            <div className="flex-1 flex flex-col h-full">
              <MenuSwiper
                items={filteredMenuItems}
                activeIndex={swiperIndex}
                onActiveIndexChange={setSwiperIndex}
                onAddItem={(item, qty) => handleAddItem(item, qty)}
                onOpenDetails={(item) => setDetailItem(item)}
              />
            </div>
          )}
          {activeTab === 'status' && (
            <div className="flex-1 flex flex-col h-full">
              <OrderStatusPanel
                cart={cart}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onPlaceOrder={handlePlaceOrder}
                activeOrders={activeOrders}
                completedOrders={completedOrders}
                tableNumber={tableNumber}
                onNewOrder={() => setActiveTab('menu')}
              />
            </div>
          )}
        </main>

        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute bottom-18 left-4 right-4 z-50 bg-[#1e1b4b] text-neutral-100 p-3.5 rounded-xl shadow-lg flex items-center gap-2.5"
            >
              <div className="bg-primary-container p-1 rounded-full text-on-primary-container">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="font-sans font-medium text-xs text-neutral-100">{toastMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dish Detail Modal */}
        <DishDetailModal
          isOpen={detailItem !== null}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          onAddToOrder={(item, quantity, notes) => {
            handleAddItem(item, quantity, notes);
          }}
        />

        {/* Bottom Navigation */}
        <nav className="bg-surface/95 backdrop-blur-md flex justify-around items-center h-16 shrink-0 relative z-30 select-none">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'menu' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Utensils className={`w-5 h-5 mb-1 ${activeTab === 'menu' ? 'fill-primary/20' : ''}`} />
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Menu</span>
            {activeTab === 'menu' && (
              <motion.div layoutId="active-tab-glow" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'status' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="relative">
              <ReceiptText className={`w-5 h-5 mb-1 ${activeTab === 'status' ? 'fill-primary/20' : ''}`} />
              {cartPlatesTotalCount > 0 && activeOrders.length === 0 && (
                <span className="absolute -top-1 -right-2 bg-primary text-on-primary font-mono text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center animate-bounce shadow">
                  {cartPlatesTotalCount}
                </span>
              )}
              {activeOrders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-pending w-2.5 h-2.5 rounded-full animate-ping" />
              )}
            </div>
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Status</span>
            {activeTab === 'status' && (
              <motion.div layoutId="active-tab-glow" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
        </nav>
      </div>
    </>
  );
}
