import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReceiptText, ShoppingCart, CheckCircle2, X, Menu } from 'lucide-react';
import DishDetailModal from './DishDetailModal';
import OrderStatusPanel from './OrderStatusPanel';
import GridView from './GridView';

export default function MenuWrapper({
  menuUrl,
  restaurantName,
  menuItems,
  cartQuantities,
  cart, cartPlatesTotalCount,
  handleAddItem, handleRemoveCartItem, handleClearCart,
  activeOrders, completedOrders,
  tableNumber,
  submitting, handlePlaceOrder,
  toastMessage,
}) {
  const [activeTab, setActiveTab] = useState('menu');
  const [detailItem, setDetailItem] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef(null);

  const handleIframeError = useCallback(() => {
    setIframeError(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  const openInBrowser = useCallback(() => {
    window.open(menuUrl, '_blank', 'noopener,noreferrer');
  }, [menuUrl]);

  return (
    <div className="fixed inset-0 bg-background text-on-surface antialiased flex flex-col sm:hidden">
      {/* Iframe area */}
      <div className="flex-1 relative overflow-hidden">
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">Loading menu...</p>
            </div>
          </div>
        )}

        {iframeError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10 p-6">
            <div className="text-center max-w-xs">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Menu couldn't be embedded</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                This restaurant's website doesn't allow embedding. Tap below to open it in your browser.
              </p>
              <button
                onClick={openInBrowser}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-sans font-medium text-sm"
              >
                Open in Browser
              </button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={menuUrl}
            className="w-full h-full border-0"
            title={`${restaurantName} menu`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          />
        )}

        {/* Restaurant name badge */}
        {iframeLoaded && !iframeError && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none pt-3 pb-8 px-4">
            <span className="text-white text-xs font-semibold tracking-wider uppercase drop-shadow-md">
              {restaurantName}
            </span>
          </div>
        )}
      </div>

      {/* Dish Detail Modal */}
      <DishDetailModal
        isOpen={detailItem !== null}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onAddToOrder={(item, quantity, notes) => {
          handleAddItem(item, quantity, notes);
          setDetailItem(null);
        }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute bottom-20 left-4 right-4 z-50 bg-[#1e1b4b] text-neutral-100 p-3.5 rounded-xl shadow-lg flex items-center gap-2.5"
          >
            <div className="bg-primary-container p-1 rounded-full text-on-primary-container">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-sans font-medium text-xs text-neutral-100">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar */}
      <div className="bg-surface/95 backdrop-blur-md border-t border-border/40">
        {/* Order / Status content */}
        {activeTab === 'order' && (
          <div className="max-h-[50vh] overflow-y-auto border-b border-border/40">
            <GridView
              items={menuItems}
              cartQuantities={cartQuantities}
              onOpenDetails={(item) => setDetailItem(item)}
              onAddItem={handleAddItem}
            />
          </div>
        )}
        {activeTab === 'status' && (
          <div className="max-h-[50vh] overflow-y-auto border-b border-border/40">
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

        {/* Bottom Navigation */}
        <nav className="flex justify-around items-center h-16 shrink-0 select-none">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'menu' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Menu className={`w-5 h-5 mb-1 ${activeTab === 'menu' ? 'fill-primary/20' : ''}`} />
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Menu</span>
            {activeTab === 'menu' && (
              <motion.div layoutId="wrapper-active-tab" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center justify-center w-full h-full relative cursor-pointer outline-none transition-colors ${
              activeTab === 'order' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShoppingCart className={`w-5 h-5 mb-1 ${activeTab === 'order' ? 'fill-primary/20' : ''}`} />
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Order</span>
            {cartPlatesTotalCount > 0 && (
              <span className="absolute top-0.5 right-3 bg-primary text-on-primary font-mono text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow">
                {cartPlatesTotalCount}
              </span>
            )}
            {activeTab === 'order' && (
              <motion.div layoutId="wrapper-active-tab" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
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
              {activeOrders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-pending w-2.5 h-2.5 rounded-full animate-ping" />
              )}
            </div>
            <span className="font-sans font-bold text-[10px] uppercase tracking-wider">Status</span>
            {activeTab === 'status' && (
              <motion.div layoutId="wrapper-active-tab" className="absolute top-0 w-8 h-1 bg-primary rounded-full" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
