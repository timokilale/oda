/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Clock, Sparkles, AlertCircle, RefreshCw, X, Receipt, CheckCircle, CookingPot, RotateCcw, Utensils, HelpCircle } from 'lucide-react';
import { CartItem, Order, OrderStatus } from '../types';

interface OrderStatusPanelProps {
  cart: CartItem[];
  onRemoveCartItem: (dishId: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (tableNumber: string, orderNotes: string) => void;
  activeOrder: Order | null;
  onResetOrder: () => void;
  orderHistory: Order[];
}

export default function OrderStatusPanel({
  cart,
  onRemoveCartItem,
  onClearCart,
  onPlaceOrder,
  activeOrder,
  onResetOrder,
  orderHistory
}: OrderStatusPanelProps) {
  const [tableNumber, setTableNumber] = useState<string>('Table 08');
  const [orderNotes, setOrderNotes] = useState<string>('');
  
  // Local simulated ticks for active order status
  const [localStatus, setLocalStatus] = useState<OrderStatus>('received');
  const [countdown, setCountdown] = useState<number>(30); // seconds to next phase

  // Sync state when active order changes
  useEffect(() => {
    if (activeOrder) {
      setLocalStatus(activeOrder.status);
      setCountdown(35); // Reset clock ticks
    }
  }, [activeOrder]);

  // Run autonomous simulator ticks for the order!
  useEffect(() => {
    if (!activeOrder || localStatus === 'served' || localStatus === 'cancelled') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Transition to next status phase
          let nextStat: OrderStatus = 'received';
          if (localStatus === 'received') {
            nextStat = 'cooking';
          } else if (localStatus === 'cooking') {
            nextStat = 'ready';
          } else if (localStatus === 'ready') {
            nextStat = 'served';
          }
          setLocalStatus(nextStat);
          // Auto update parent / trigger external callbacks if needed
          activeOrder.status = nextStat;
          return 35; // Reset countdown for the next tier
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeOrder, localStatus]);

  // Handle manual mock triggers
  const forceStatus = (target: OrderStatus) => {
    setLocalStatus(target);
    if (activeOrder) {
      activeOrder.status = target;
    }
    setCountdown(35);
  };

  const salesTaxRate = 0.0825; // 8.25%
  const serviceChargeRate = 0.10; // 10% Service charge

  // Calculations for current cart
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const cartTax = cartSubtotal * salesTaxRate;
  const cartService = cartSubtotal * serviceChargeRate;
  const cartTotal = cartSubtotal + cartTax + cartService;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onPlaceOrder(tableNumber, orderNotes);
    setOrderNotes('');
  };

  return (
    <div id="order-status-panel" className="flex-1 w-full bg-background overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-6">
        
        {/* Scenario 1: Active Order Tracker Screen */}
        {activeOrder ? (
          <div className="space-y-6">
            
            {/* Status Card Hero */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface rounded-xl border border-border p-5 shadow-[0_8px_30px_rgba(30,27,75,0.03)] relative overflow-hidden"
            >
              {/* Soft decorative status background color */}
              <div className={`absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 opacity-15 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
                localStatus === 'received' ? 'bg-primary' :
                localStatus === 'cooking' ? 'bg-pending' :
                localStatus === 'ready' ? 'bg-tertiary' : 'bg-success'
              }`} />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-xs text-on-surface-variant/60 uppercase tracking-widest">Active Order</p>
                    <h3 className="font-mono text-base font-bold text-on-surface">
                      #BK-9402{activeOrder.orderNumber}
                    </h3>
                  </div>
                  
                  {/* Status Pill Badge */}
                  <span className={`font-sans font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border ${
                    localStatus === 'received' ? 'bg-surface-container border-border text-on-surface-variant' :
                    localStatus === 'cooking' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    localStatus === 'ready' ? 'bg-purple-50 border-purple-200 text-purple-700 animate-pulse' :
                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    {localStatus}
                  </span>
                </div>

                {/* Simulated Timer or complete details */}
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-border">
                  {localStatus === 'received' && <Clock className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '6s' }} />}
                  {localStatus === 'cooking' && <CookingPot className="w-5 h-5 text-pending animate-bounce" />}
                  {localStatus === 'ready' && <Utensils className="w-5 h-5 text-tertiary animate-wiggle" />}
                  {localStatus === 'served' && <CheckCircle className="w-5 h-5 text-success" />}
                  
                  <div className="flex-1 text-xs">
                    <p className="font-sans font-bold text-on-surface">
                      {localStatus === 'received' && 'Awaiting kitchen ticket admission...'}
                      {localStatus === 'cooking' && 'Our Master Chefs are cooking...'}
                      {localStatus === 'ready' && 'Plated elegantly! Ready to serve...'}
                      {localStatus === 'served' && 'Your culinary dishes have been served.'}
                    </p>
                    
                    {localStatus !== 'served' && (
                      <p className="font-sans text-on-surface-variant/80 mt-0.5">
                        Transitioning phases automatically in <strong className="font-mono text-primary">{countdown}s</strong>
                      </p>
                    )}
                    {localStatus === 'served' && (
                      <p className="font-sans text-on-surface-variant/80 mt-0.5">
                        Bon appétit! Excellent taste. Feel free to browse additional desserts.
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline Visual Trackers */}
                <div className="pt-2 relative">
                  <div className="absolute top-[17px] left-3 inset-x-3 h-0.5 bg-surface-container z-0" />
                  
                  {/* Underlay progress bar */}
                  <div 
                    className="absolute top-[17px] left-3 h-0.5 bg-primary z-0 transition-all duration-700" 
                    style={{ 
                      width: 
                        localStatus === 'received' ? '5%' :
                        localStatus === 'cooking' ? '50%' :
                        localStatus === 'ready' ? '80%' : '100%' 
                    }} 
                  />

                  <div className="grid grid-cols-4 text-center text-[10px] uppercase font-sans font-semibold tracking-wider relative z-10">
                    
                    {/* Item 1: Received */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => forceStatus('received')}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] bg-surface transition-all ${
                        localStatus === 'received' || localStatus === 'cooking' || localStatus === 'ready' || localStatus === 'served'
                          ? 'border-primary text-primary font-black scale-110'
                          : 'border-outline-variant text-on-surface-variant/40'
                      }`}>
                        {['cooking', 'ready', 'served'].includes(localStatus) ? '✓' : '1'}
                      </div>
                      <span className={localStatus === 'received' ? 'text-primary' : 'text-on-surface-variant/60'}>Ordered</span>
                    </div>

                    {/* Item 2: Cooking */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => forceStatus('cooking')}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] bg-surface transition-all ${
                        localStatus === 'cooking' || localStatus === 'ready' || localStatus === 'served'
                          ? 'border-primary text-primary font-black scale-110'
                          : 'border-outline-variant text-on-surface-variant/40'
                      }`}>
                        {['ready', 'served'].includes(localStatus) ? '✓' : '2'}
                      </div>
                      <span className={localStatus === 'cooking' ? 'text-primary' : 'text-on-surface-variant/60'}>Kitchen</span>
                    </div>

                    {/* Item 3: Ready */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => forceStatus('ready')}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] bg-surface transition-all ${
                        localStatus === 'ready' || localStatus === 'served'
                          ? 'border-primary text-primary font-black scale-110'
                          : 'border-outline-variant text-on-surface-variant/40'
                      }`}>
                        {localStatus === 'served' ? '✓' : '3'}
                      </div>
                      <span className={localStatus === 'ready' ? 'text-primary' : 'text-on-surface-variant/60'}>Ready</span>
                    </div>

                    {/* Item 4: Served */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => forceStatus('served')}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] bg-surface transition-all ${
                        localStatus === 'served'
                          ? 'border-primary text-primary font-black scale-110'
                          : 'border-outline-variant text-on-surface-variant/40'
                      }`}>
                        4
                      </div>
                      <span className={localStatus === 'served' ? 'text-primary' : 'text-on-surface-variant/60'}>Served</span>
                    </div>

                  </div>
                </div>

                {/* Simulator Manual Helper Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container justify-center">
                  <span className="text-[10px] text-outline-variant uppercase font-sans font-semibold tracking-wider mr-1">Simulate Status:</span>
                  <button
                    onClick={() => forceStatus('received')}
                    className="px-2.5 py-1 text-[10px] rounded border border-border font-sans font-medium text-on-surface-variant bg-surface hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                  >
                    1. Order
                  </button>
                  <button
                    onClick={() => forceStatus('cooking')}
                    className="px-2.5 py-1 text-[10px] rounded border border-border font-sans font-medium text-on-surface-variant bg-surface hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                  >
                    2. Cook
                  </button>
                  <button
                    onClick={() => forceStatus('ready')}
                    className="px-2.5 py-1 text-[10px] rounded border border-border font-sans font-medium text-on-surface-variant bg-surface hover:bg-surface-container transition-transform active:scale-95 cursor-pointer"
                  >
                    3. Plate
                  </button>
                  <button
                    onClick={() => forceStatus('served')}
                    className="px-2.5 py-1 text-[10px] rounded border border-emerald-200 font-sans font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-transform active:scale-95 cursor-pointer"
                  >
                     ✓ Served
                  </button>
                </div>

              </div>
            </motion.div>

            {/* Simulated Receipt Invoice */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-[0_4px_24px_rgba(30,27,75,0.02)] space-y-4">
              <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" /> Active Ticket Invoice
              </h4>

              <div id="receipt-listing" className="divide-y divide-surface-container border-y border-surface-container py-2 space-y-2">
                {activeOrder.items.map((cartItem, idx) => (
                  <div key={idx} className="flex justify-between text-xs pt-2 first:pt-0 font-sans">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-on-surface">
                        {cartItem.menuItem.name} <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded ml-1">x{cartItem.quantity}</span>
                      </p>
                      {cartItem.specialNotes && (
                        <p className="text-[10px] text-on-surface-variant italic font-light">
                          "{cartItem.specialNotes}"
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-medium text-on-surface">
                      ${(cartItem.menuItem.price * cartItem.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal, tax, service totals */}
              <div className="space-y-1.5 font-sans pt-1">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-mono">${activeOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Service Fee (10.00%)</span>
                  <span className="font-mono">${activeOrder.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>State Sales Tax (8.25%)</span>
                  <span className="font-mono">${activeOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-on-surface font-bold pt-2 border-t border-dashed border-border">
                  <span>Grand Total</span>
                  <span className="font-mono text-primary text-base">${activeOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Reset simulator Button */}
              {localStatus === 'served' && (
                <button
                  id="reset-simulation-btn"
                  onClick={onResetOrder}
                  className="w-full h-11 bg-surface border border-outline-variant/60 hover:bg-surface-container text-on-surface rounded-lg font-sans font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Order Something Else
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Scenario 2: Active Cart View (If no order has been made yet) */}
            {cart.length > 0 ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Shopping list collection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif italic font-semibold text-base text-on-surface">Selected Culinary Dishes ({cart.length})</h3>
                    <button
                      onClick={onClearCart}
                      className="text-xs font-sans text-destructive hover:underline font-semibold"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {cart.map((cartItem) => (
                      <div
                        key={cartItem.menuItem.id}
                        id={`cart-row-${cartItem.menuItem.id}`}
                        className="bg-surface rounded-xl border border-border p-3 flex gap-3 relative shadow-xs"
                      >
                        {/* 1:1 Thumb dish image */}
                        <div className="w-16 h-16 min-w-16 rounded-full bg-surface-container-low overflow-hidden self-center border border-border">
                          <img
                            src={cartItem.menuItem.image}
                            alt={cartItem.menuItem.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Middle textual area */}
                        <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-serif italic font-semibold text-sm sm:text-[15px] text-on-surface truncate">
                              {cartItem.menuItem.name}
                            </h4>
                            <span className="font-mono text-xs font-semibold text-on-surface whitespace-nowrap">
                              ${(cartItem.menuItem.price * cartItem.quantity).toFixed(2)}
                            </span>
                          </div>
                          
                          <p className="font-mono text-[10px] text-primary font-medium mt-0.5">
                            {cartItem.quantity} x ${cartItem.menuItem.price.toFixed(2)}
                          </p>

                          {cartItem.specialNotes && (
                            <p className="font-sans text-[10px] text-on-surface-variant/70 italic line-clamp-1 mt-1 bg-surface-container-low px-1.5 py-0.5 rounded">
                              Notes: "{cartItem.specialNotes}"
                            </p>
                          )}
                        </div>

                        {/* Swipe delete button */}
                        <button
                          onClick={() => onRemoveCartItem(cartItem.menuItem.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-error-container/20 text-on-surface-variant/40 hover:text-error rounded-full transition-colors"
                          aria-label={`Remove ${cartItem.menuItem.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seating coordinates selection (No fake databases context) */}
                <div className="bg-surface rounded-xl border border-border p-4.5 space-y-3">
                  <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest">
                    Dining Room Placement
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-on-surface-variant/80 uppercase font-sans font-semibold">Table Coordinates</label>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-surface-container-low text-xs border border-border rounded-lg p-2.5 focus:border-primary focus:outline-none"
                      >
                        <option value="Table 02">Table 02 (Indoor booth)</option>
                        <option value="Table 04">Table 04 (Window sunset)</option>
                        <option value="Table 08">Table 08 (Main lobby VIP)</option>
                        <option value="Table 12">Table 12 (Garden terrace)</option>
                        <option value="Table 15">Table 15 (Bar counter)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-on-surface-variant/80 uppercase font-sans font-semibold">Service Speed</label>
                      <div className="bg-surface-container-low border border-border rounded-lg p-2.5 text-xs text-on-surface font-sans font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Express Prep
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-sans">
                    <label className="block text-[10px] text-on-surface-variant/80 uppercase font-semibold">Overall Order Notes</label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Bring wine first, allergen precaution..."
                      className="w-full text-xs bg-surface-container-low border border-border rounded-lg p-2.5 focus:border-primary focus:outline-none placeholder:text-on-surface-variant/40"
                    />
                  </div>
                </div>

                {/* Subtotals detail receipt block */}
                <div className="bg-surface rounded-xl border border-border p-4.5 space-y-3 shadow-xs">
                  <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest">Billing Estimations</h4>
                  
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Dining Plate Subtotal</span>
                      <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Service Charge (10.00%)</span>
                      <span className="font-mono">${cartService.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>State Sales Tax (8.25%)</span>
                      <span className="font-mono">${cartTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-on-surface font-bold pt-2 border-t border-dashed border-border mt-1">
                      <span>Total Invoice</span>
                      <span className="font-mono text-primary text-base">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    id="place-order-checkout-btn"
                    onClick={handleCheckout}
                    className="w-full h-12 bg-primary text-on-primary rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-98 transition-all shadow-sm pb-safe-offset"
                  >
                    Place Dining Order (${cartTotal.toFixed(2)})
                  </button>
                </div>

              </div>
            ) : (
              /* Scenario 3: EMPTY CART */
              <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant/50 space-y-3">
                <Utensils className="w-12 h-12 stroke-[1.5] text-outline-variant" />
                <h4 className="font-semibold text-sm font-sans text-on-surface">No Pending Dishes Selected</h4>
                <p className="text-xs max-w-xs font-sans">
                  Browse our high-end catalog menu and add delicious plates to your dining list to place an order.
                </p>
              </div>
            )}

            {/* Past Order History Section (Fully functional with list state) */}
            {orderHistory.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest">
                  Order Ticket History ({orderHistory.length})
                </h4>

                <div className="space-y-2.5">
                  {orderHistory.map((past, idx) => (
                    <div
                      key={past.id}
                      className="bg-surface rounded-xl border border-border p-3.5 flex justify-between items-center text-xs font-sans shadow-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-on-surface">Dining Order Ticket #{past.orderNumber}</p>
                        <p className="text-[10px] text-on-surface-variant/60">
                          {past.createdAt} · {past.items.reduce((sum, i) => sum + i.quantity, 0)} plates
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="font-mono font-bold text-primary block">${past.total.toFixed(2)}</span>
                        <span className="inline-block text-[9px] font-bold text-[success] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 uppercase">
                          {past.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
