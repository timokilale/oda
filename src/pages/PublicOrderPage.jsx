import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Utensils, ReceiptText, ArrowLeft, Compass, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { transformMenuItem, transformMenuItems, transformOrder } from '../types/publicOrderTypes';
import MenuSwiper from '../components/public-order/MenuSwiper';
import GridView from '../components/public-order/GridView';
import DishDetailModal from '../components/public-order/DishDetailModal';
import OrderStatusPanel from '../components/public-order/OrderStatusPanel';

const POLL_INTERVAL = 30000;

export default function PublicOrderPage() {
  const { restaurantRef } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '';

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');

  const [activeTab, setActiveTab] = useState('menu');
  const [menuSubView, setMenuSubView] = useState('swiper');
  const [swiperIndex, setSwiperIndex] = useState(0);
  const [detailItem, setDetailItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ordersMounted = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadContext() {
      if (!tableNumber || !restaurantRef) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLookupError('');
      try {
        const data = await apiRequest(`/public/restaurants/${encodeURIComponent(restaurantRef)}/order-context?table=${encodeURIComponent(tableNumber)}`);
        if (!active) return;
        setContext(data);
      } catch (error) {
        if (!active) return;
        setContext(null);
        setLookupError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadContext();
    return () => { active = false; };
  }, [restaurantRef, tableNumber]);

  const menuItems = useMemo(
    () => transformMenuItems(context?.menuItems),
    [context?.menuItems],
  );

  const menuIsReady = Boolean(context?.menuItems?.length);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(`/public/restaurants/${encodeURIComponent(restaurantRef)}/orders?table=${encodeURIComponent(tableNumber)}`);
      if (ordersMounted.current) setOrders(data.orders || []);
    } catch {
      // silent
    } finally {
      if (ordersMounted.current) setOrdersLoading(false);
    }
  }, [restaurantRef, tableNumber]);

  useEffect(() => {
    if (!tableNumber) return;
    ordersMounted.current = true;
    setOrdersLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, POLL_INTERVAL);
    return () => {
      ordersMounted.current = false;
      clearInterval(interval);
    };
  }, [loadOrders, tableNumber]);

  const handleAddItem = useCallback((item, quantity, notes) => {
    setCart((prev) => {
      const matchIdx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (matchIdx > -1) {
        const copy = [...prev];
        copy[matchIdx] = {
          ...copy[matchIdx],
          quantity: copy[matchIdx].quantity + quantity,
          specialNotes: notes || copy[matchIdx].specialNotes,
        };
        return copy;
      }
      return [...prev, { menuItem: item, quantity, specialNotes: notes || '' }];
    });
    triggerToast(`Added ${quantity}x ${item.name}`);
  }, []);

  const handleRemoveCartItem = useCallback((dishId) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== dishId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  }, []);

  const handlePlaceOrder = useCallback(async (orderNotes) => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await apiRequest(`/public/restaurants/${encodeURIComponent(restaurantRef)}/orders`, {
        method: 'POST',
        body: {
          tableNumber: tableNumber,
          items: cart.map((c) => ({
            id: Number(c.menuItem.id),
            quantity: c.quantity,
          })),
        },
      });
      setCart([]);
      setActiveTab('status');
      triggerToast(response.successMessage || 'Order placed!');
      await loadOrders();
    } catch (error) {
      triggerToast(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }, [cart, submitting, restaurantRef, tableNumber, loadOrders, triggerToast]);

  const cartQuantities = useMemo(() => {
    return cart.reduce((acc, cur) => {
      acc[cur.menuItem.id] = (acc[cur.menuItem.id] || 0) + cur.quantity;
      return acc;
    }, {});
  }, [cart]);

  const cartPlatesTotalCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const transformedOrders = useMemo(() => (orders || []).map(transformOrder), [orders]);
  const activeOrders = useMemo(
    () => transformedOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed'),
    [transformedOrders],
  );
  const completedOrders = useMemo(
    () => transformedOrders.filter((o) => o.status === 'completed' || o.status === 'cancelled'),
    [transformedOrders],
  );

  // --- Loading/Error states ---
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
    <div className="min-h-dvh bg-background text-on-surface antialiased flex justify-center">
      <div className="w-full max-w-sm sm:max-w-md h-[100dvh] sm:h-[880px] bg-background flex flex-col justify-between relative sm:rounded-2xl sm:shadow-2xl overflow-hidden border border-border/10">
        {/* Header */}
        <header className="relative z-40 bg-surface border-b border-border flex justify-between items-end px-5 pt-4 pb-3 h-18 shrink-0 select-none">
          <div className="flex items-center pb-0.5">
            {activeTab === 'status' || menuSubView === 'grid' ? (
              <button
                onClick={() => {
                  if (activeTab === 'status') {
                    setActiveTab('menu');
                  } else {
                    setMenuSubView('swiper');
                  }
                }}
                className="p-1.5 -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-all active:scale-90 border border-transparent hover:border-border"
                aria-label="Back"
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
            <h1 className="font-serif italic text-lg leading-tight mt-0.5 text-on-surface font-semibold">
              {activeTab === 'menu'
                ? menuSubView === 'swiper' ? 'Browse Menu' : 'All Dishes'
                : activeOrders.length > 0 ? 'Order Status' : 'Cart'}
            </h1>
          </div>

          <div className="flex items-center pb-0.5">
            {activeTab === 'menu' ? (
              <button
                onClick={() => setMenuSubView((prev) => (prev === 'swiper' ? 'grid' : 'swiper'))}
                className={`p-2 -mr-1.5 rounded-full transition-all active:scale-90 border overflow-hidden flex items-center justify-center ${
                  menuSubView === 'grid'
                    ? 'bg-primary text-on-primary border-primary'
                    : 'text-on-surface hover:bg-surface-container border-border/60 bg-surface-container-low'
                }`}
                title={menuSubView === 'grid' ? 'Swiper view' : 'Grid view'}
              >
                {menuSubView === 'swiper' ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-hidden flex flex-col relative z-10">
          {activeTab === 'menu' && menuSubView === 'swiper' && (
            <div className="flex-1 flex flex-col h-full">
              <MenuSwiper
                items={menuItems}
                activeIndex={swiperIndex}
                onActiveIndexChange={setSwiperIndex}
                onAddItem={(item, qty) => handleAddItem(item, qty)}
                onOpenDetails={(item) => setDetailItem(item)}
              />
            </div>
          )}
          {activeTab === 'menu' && menuSubView === 'grid' && (
            <div className="flex-1 flex flex-col h-full">
              <GridView
                items={menuItems}
                onOpenDetails={(item) => setDetailItem(item)}
                onAddItem={(item, qty) => handleAddItem(item, qty)}
                cartQuantities={cartQuantities}
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
              className="absolute bottom-18 left-4 right-4 z-50 bg-[#1e1b4b] text-neutral-100 p-3.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2.5"
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
        <nav className="bg-surface/95 backdrop-blur-md border-t border-border flex justify-around items-center h-16 shrink-0 relative z-30 select-none">
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
                <span className="absolute -top-1 -right-2 bg-primary text-on-primary font-mono text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-surface animate-bounce shadow">
                  {cartPlatesTotalCount}
                </span>
              )}
              {activeOrders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-pending w-2.5 h-2.5 rounded-full border border-surface animate-ping" />
              )}
            </div>
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Status</span>
            {activeTab === 'status' && (
              <motion.div layoutId="active-tab-glow" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
