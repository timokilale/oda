/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Utensils, ReceiptText, ArrowLeft, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { MENU_ITEMS, MenuItem, CartItem, Order, OrderStatus } from './types';

import MenuSwiper from './components/MenuSwiper';
import GridView from './components/GridView';
import DishDetailModal from './components/DishDetailModal';
import OrderStatusPanel from './components/OrderStatusPanel';

export default function App() {
  // Core Tabs
  const [activeTab, setActiveTab] = useState<'menu' | 'status'>('menu');
  // Secondary sub-tab on the Menu route (Swiper / Carousel vs. Grid Search)
  const [menuSubView, setMenuSubView] = useState<'swiper' | 'grid'>('swiper');

  // Carousel slider point
  const [swiperIndex, setSwiperIndex] = useState<number>(0);

  // Focus Modal Item
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

  // Cart Local States (Pre-checkout)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('indigo_kitchen_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Active Order Tracking (Ongoing preparation session)
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem('indigo_kitchen_active_order');
    return saved ? JSON.parse(saved) : null;
  });

  // Previous Orders history log
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('indigo_kitchen_order_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Active micro-toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state modifications automatically back to client localStorage
  useEffect(() => {
    localStorage.setItem('indigo_kitchen_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('indigo_kitchen_active_order', JSON.stringify(activeOrder));
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem('indigo_kitchen_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Utility to handle adding items to the active dining list
  const handleAddItemToOrder = (item: MenuItem, amt: number, notes?: string) => {
    setCart(prev => {
      const matchIdx = prev.findIndex(c => c.menuItem.id === item.id);
      if (matchIdx > -1) {
        const copy = [...prev];
        copy[matchIdx] = {
          ...copy[matchIdx],
          quantity: copy[matchIdx].quantity + amt,
          specialNotes: notes || copy[matchIdx].specialNotes
        };
        return copy;
      }
      return [...prev, { menuItem: item, quantity: amt, specialNotes: notes }];
    });

    triggerToast(`Added ${amt}x ${item.name} to list`);
  };

  const handleRemoveCartItem = (dishId: string) => {
    setCart(prev => prev.filter(c => c.menuItem.id !== dishId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Convert current cart list into actual active Order & dispatch to tracking screen
  const handlePlaceOrder = (tableNum: string, overallNotes: string) => {
    if (cart.length === 0) return;

    // Subtotal math
    const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const tax = subtotal * 0.0825;
    const serviceCharge = subtotal * 0.10;
    const total = subtotal + tax + serviceCharge;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderHistory.length + 1,
      items: [...cart],
      subtotal,
      tax,
      serviceCharge,
      total,
      status: 'received',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveOrder(newOrder);
    setCart([]); // Clear pending list
    setActiveTab('status'); // Auto route to status screen to verify simulate!
    triggerToast(`Dining ticket submitted for ${tableNum}!`);
  };

  const handleResetOrderSession = () => {
    if (activeOrder) {
      // Save prior concluded check to general logs
      setOrderHistory(prev => [activeOrder, ...prev]);
      setActiveOrder(null);
    }
  };

  // Quantities currently in the active cart
  const cartQuantities = cart.reduce((acc, current) => {
    acc[current.menuItem.id] = (acc[current.menuItem.id] || 0) + current.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Compute total number of items currently in cart
  const cartPlatesTotalCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div id="restaurant-terminal-stage" className="min-h-screen bg-neutral-900 flex justify-center items-center">
      
      {/* Shell frame that keeps exactly matching mobile ratios on wider desktops */}
      <div 
        id="applet-frame" 
        className="w-full max-w-sm sm:max-w-md h-[100dvh] sm:h-[880px] bg-background text-on-background flex flex-col justify-between relative sm:rounded-2xl sm:shadow-2xl overflow-hidden border border-border/10"
      >
        
        {/* Top Header Navigation */}
        <header id="stage-header" className="relative z-40 bg-surface border-b border-border flex justify-between items-end px-5 pt-4 pb-3 h-18 shrink-0 select-none">
          
          {/* Back Action - switches menu view or defaults, matching back arrow from slide */}
          <div className="flex items-center pb-0.5">
            {activeTab === 'status' || menuSubView === 'grid' ? (
              <button
                id="header-back-btn"
                onClick={() => {
                  if (activeTab === 'status') {
                    setActiveTab('menu');
                  } else {
                    setMenuSubView('swiper');
                  }
                }}
                className="p-1.5 -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-all active:scale-90 border border-transparent hover:border-border"
                aria-label="Back to main browser"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-[1px] bg-primary/20" />
            )}
          </div>

          {/* Title Area - Implements Quarterly Journal Branding Accent */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] font-black opacity-60 text-secondary">
              Indigo Kitchen
            </span>
            <h1 className="font-serif italic text-lg leading-tight mt-0.5 text-on-surface font-semibold">
              {activeTab === 'menu' ? (
                menuSubView === 'swiper' ? 'Browse Menu' : 'Signature Dishes'
              ) : (
                activeOrder ? 'Ticket Tracker' : 'Selected Plates'
              )}
            </h1>
          </div>

          {/* Switch Grid/Slide Catalog trigger */}
          <div className="flex items-center pb-0.5">
            {activeTab === 'menu' ? (
              <button
                id="header-subview-toggle-btn"
                onClick={() => setMenuSubView(prev => prev === 'swiper' ? 'grid' : 'swiper')}
                className={`p-2 -mr-1.5 rounded-full transition-all active:scale-90 border overflow-hidden flex items-center justify-center ${
                  menuSubView === 'grid'
                    ? 'bg-primary text-on-primary border-primary'
                    : 'text-on-surface hover:bg-surface-container border-border/60 bg-surface-container-low'
                }`}
                title={menuSubView === 'grid' ? "Slide Carousel view" : "Compact Grid view"}
              >
                {menuSubView === 'swiper' ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-8 h-[1px] bg-primary/20" />
            )}
          </div>
        </header>

        {/* Content routing stage */}
        <main id="stage-body" className="flex-1 overflow-hidden flex flex-col relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'menu' ? (
              menuSubView === 'swiper' ? (
                <motion.div
                  key="swiper-subview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <MenuSwiper
                    items={MENU_ITEMS}
                    activeIndex={swiperIndex}
                    setActiveIndex={setSwiperIndex}
                    onAddItem={(it, q) => handleAddItemToOrder(it, q)}
                    onOpenDetails={(it) => setDetailItem(it)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="grid-subview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <GridView
                    items={MENU_ITEMS}
                    onOpenDetails={(it) => setDetailItem(it)}
                    onAddItem={(it, q) => handleAddItemToOrder(it, q)}
                    cartQuantities={cartQuantities}
                  />
                </motion.div>
              )
            ) : (
              <motion.div
                key="status-subview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <OrderStatusPanel
                  cart={cart}
                  onRemoveCartItem={handleRemoveCartItem}
                  onClearCart={handleClearCart}
                  onPlaceOrder={handlePlaceOrder}
                  activeOrder={activeOrder}
                  onResetOrder={handleResetOrderSession}
                  orderHistory={orderHistory}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Dynamic Float alert Toast notification panels */}
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

        {/* Global Popup Dish Detailed modal overlay */}
        <DishDetailModal
          isOpen={detailItem !== null}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          onAddToOrder={(quantity, notes) => {
            if (detailItem) {
              handleAddItemToOrder(detailItem, quantity, notes);
            }
          }}
        />

        {/* Fixed Under Bottom Tab Bar Navigation */}
        <nav 
          id="global-bottom-navigation" 
          className="bg-surface/95 backdrop-blur-md border-t border-border flex justify-around items-center h-16 shrink-0 relative z-30 select-none pb-safe"
        >
          {/* Item 1: Menu Navigation */}
          <button
            id="tab-btn-menu"
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'menu' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Utensils className={`w-5 h-5 mb-1 ${activeTab === 'menu' ? 'fill-primary/20' : ''}`} />
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Menu</span>
            {activeTab === 'menu' && (
              <motion.div
                layoutId="active-tab-glow"
                className="absolute top-0 w-8 h-1 bg-primary rounded-full"
              />
            )}
          </button>

          {/* Item 2: Status Navigation (Holds live dynamic cart badges) */}
          <button
            id="tab-btn-status"
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'status' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <div className="relative">
              <ReceiptText className={`w-5 h-5 mb-1 ${activeTab === 'status' ? 'fill-primary/20' : ''}`} />
              
              {/* Active Cart indicators */}
              {cartPlatesTotalCount > 0 && !activeOrder && (
                <span className="absolute -top-1 -right-2 bg-primary text-on-primary font-mono text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-surface animate-bounce shadow">
                  {cartPlatesTotalCount}
                </span>
              )}
              {/* Active cooking progression beacon */}
              {activeOrder && activeOrder.status !== 'served' && (
                <span className="absolute -top-0.5 -right-0.5 bg-pending w-2.5 h-2.5 rounded-full border border-surface animate-ping" />
              )}
            </div>
            
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Status</span>
            {activeTab === 'status' && (
              <motion.div
                layoutId="active-tab-glow"
                className="absolute top-0 w-8 h-1 bg-primary rounded-full"
              />
            )}
          </button>
        </nav>

      </div>
    </div>
  );
}
