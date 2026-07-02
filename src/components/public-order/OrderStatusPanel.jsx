import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CookingPot, CheckCircle, Utensils, RotateCcw, X } from 'lucide-react';
import { formatCurrency } from '../../lib/format';
import { STATUS_LABELS, backendOrderStatusToStep } from '../../types/publicOrderTypes';

const STEPS = ['pending', 'confirmed', 'completed'];

function OrderStatusTracker({ order, onNewOrder }) {
  const step = backendOrderStatusToStep(order.status);
  const isServed = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface rounded-xl border border-border p-5 shadow-[0_8px_30px_rgba(30,27,75,0.03)] relative overflow-hidden"
      >
        <div className={`absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 opacity-15 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
          order.status === 'pending' ? 'bg-primary' :
          order.status === 'confirmed' ? 'bg-pending' :
          order.status === 'completed' ? 'bg-success' : 'bg-error'
        }`} />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-xs text-on-surface-variant/60 uppercase tracking-widest">Active Order</p>
              <h3 className="font-mono text-base font-bold text-on-surface">
                #{order.orderNumber}
              </h3>
            </div>

            <span className={`font-sans font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border ${
              isCancelled ? 'bg-error-container text-on-error-container border-error/30' :
              isServed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              order.status === 'pending' ? 'bg-surface-container border-border text-on-surface-variant' :
              'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {STATUS_LABELS[order.status]?.label || order.status}
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-border">
            {order.status === 'pending' && <Clock className="w-5 h-5 text-primary animate-spin" style={{ animationDuration: '6s' }} />}
            {order.status === 'confirmed' && <CookingPot className="w-5 h-5 text-pending animate-bounce" />}
            {isServed && <CheckCircle className="w-5 h-5 text-success" />}
            {isCancelled && <X className="w-5 h-5 text-error" />}

            <div className="flex-1 text-xs">
              <p className="font-sans font-bold text-on-surface">
                {isCancelled ? 'This order was cancelled.' :
                 isServed ? 'Your order has been served. Bon appétit!' :
                 order.status === 'confirmed' ? 'Our chefs are preparing your meal...' :
                 'Your order is pending confirmation.'}
              </p>
              {!isServed && !isCancelled && (
                <p className="font-sans text-on-surface-variant/80 mt-0.5">
                  We will update you as your order progresses.
                </p>
              )}
              {isServed && (
                <p className="font-sans text-on-surface-variant/80 mt-0.5">
                  Feel free to browse the menu for more.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 relative">
            <div className="absolute top-[17px] left-3 inset-x-3 h-0.5 bg-surface-container z-0" />
            <div
              className="absolute top-[17px] left-3 h-0.5 bg-primary z-0 transition-all duration-700"
              style={{
                width: isCancelled ? '0%' :
                  step < 0 ? '0%' :
                  step === 0 ? '5%' :
                  step === 1 ? '50%' :
                  '100%',
              }}
            />

            <div className="grid grid-cols-3 text-center text-[10px] uppercase font-sans font-semibold tracking-wider relative z-10">
              {STEPS.map((s, i) => {
                const isActive = step >= i;
                const isComplete = step > i;
                return (
                  <div key={s} className="flex flex-col items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] bg-surface transition-all ${
                      isActive
                        ? 'border-primary text-primary font-black scale-110'
                        : 'border-outline-variant text-on-surface-variant/40'
                    }`}>
                      {isComplete ? '✓' : i + 1}
                    </div>
                    <span className={isActive ? 'text-primary' : 'text-on-surface-variant/60'}>
                      {STATUS_LABELS[s]?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container justify-center">
            <button
              onClick={onNewOrder}
              className="px-3 py-1.5 text-[10px] rounded border border-border font-sans font-medium text-on-surface-variant bg-surface hover:bg-surface-container transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Order Something Else
            </button>
          </div>
        </div>
      </motion.div>

      <div className="bg-surface rounded-xl border border-border p-5 shadow-[0_4px_24px_rgba(30,27,75,0.02)] space-y-4">
        <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" /> Order Items
        </h4>

        <div className="divide-y divide-surface-container border-y border-surface-container py-2 space-y-2">
          {order.items.map((cartItem, idx) => (
            <div key={idx} className="flex justify-between text-xs pt-2 first:pt-0 font-sans">
              <div className="space-y-0.5">
                <p className="font-semibold text-on-surface">
                  {cartItem.menuItem?.name || cartItem.name} <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded ml-1">x{cartItem.quantity}</span>
                </p>
              </div>
              <span className="font-mono font-medium text-on-surface">
                {formatCurrency((cartItem.menuItem?.price || cartItem.price || 0) * cartItem.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm text-on-surface font-bold pt-2 border-t border-dashed border-border">
          <span>Total</span>
          <span className="font-mono text-primary text-base">{formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderStatusPanel({
  cart,
  onRemoveCartItem,
  onClearCart,
  onPlaceOrder,
  activeOrders,
  completedOrders,
  onNewOrder,
}) {
  const [orderNotes, setOrderNotes] = useState('');

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const activeOrder = activeOrders?.[0] || null;

  return (
    <div className="flex-1 w-full bg-background overflow-hidden flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-6">
        {activeOrder ? (
          <OrderStatusTracker order={activeOrder} onNewOrder={onNewOrder} />
        ) : cart.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif italic font-semibold text-base text-on-surface">
                  Selected Items ({cart.length})
                </h3>
                <button
                  onClick={onClearCart}
                  className="text-xs font-sans text-destructive hover:underline font-semibold"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2.5">
                {cart.map((cartItem) => (
                  <div
                    key={cartItem.menuItem.id}
                    className="bg-surface rounded-xl border border-border p-3 flex gap-3 relative shadow-xs"
                  >
                    <div className="w-16 h-16 min-w-16 rounded-full bg-surface-container-low overflow-hidden self-center border border-border">
                      {cartItem.menuItem.image ? (
                        <img
                          src={cartItem.menuItem.image}
                          alt={cartItem.menuItem.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">🍽</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif italic font-semibold text-sm sm:text-[15px] text-on-surface truncate">
                          {cartItem.menuItem.name}
                        </h4>
                        <span className="font-mono text-xs font-semibold text-on-surface whitespace-nowrap">
                          {formatCurrency(cartItem.menuItem.price * cartItem.quantity)}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-primary font-medium mt-0.5">
                        {cartItem.quantity} x {formatCurrency(cartItem.menuItem.price)}
                      </p>
                      {cartItem.specialNotes && (
                        <p className="font-sans text-[10px] text-on-surface-variant/70 italic line-clamp-1 mt-1 bg-surface-container-low px-1.5 py-0.5 rounded">
                          "{cartItem.specialNotes}"
                        </p>
                      )}
                    </div>

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

            <div className="bg-surface rounded-xl border border-border p-4.5 space-y-3">
              <div className="space-y-1 text-xs font-sans">
                <label className="block text-[10px] text-on-surface-variant/80 uppercase font-semibold">Order Notes</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Allergen precaution..."
                  className="w-full text-xs bg-surface-container-low border border-border rounded-lg p-2.5 focus:border-primary focus:outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4.5 space-y-3 shadow-xs">
              <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest">Order Summary</h4>
              <div className="flex justify-between text-sm text-on-surface font-bold pt-2 border-t border-dashed border-border">
                <span>Total</span>
                <span className="font-mono text-primary text-base">{formatCurrency(cartSubtotal)}</span>
              </div>

              <button
                onClick={() => {
                  onPlaceOrder(orderNotes);
                  setOrderNotes('');
                }}
                className="w-full h-12 bg-primary text-white rounded-lg font-sans font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-98 transition-all shadow-sm"
              >
                Place Order
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant/50 space-y-3">
            <Utensils className="w-12 h-12 stroke-[1.5] text-outline-variant" />
            <h4 className="font-semibold text-sm font-sans text-on-surface">No Items Selected</h4>
            <p className="text-xs max-w-xs font-sans">
              Browse our menu and add dishes to place an order.
            </p>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-xs text-on-surface-variant uppercase tracking-widest">
              Previous Orders ({completedOrders.length})
            </h4>
            <div className="space-y-2.5">
              {completedOrders.map((past) => (
                <div
                  key={past.id}
                  className="bg-surface rounded-xl border border-border p-3.5 flex justify-between items-center text-xs font-sans shadow-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-on-surface">Order #{past.orderNumber}</p>
                    <p className="text-[10px] text-on-surface-variant/60">
                      {past.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-mono font-bold text-primary block">{formatCurrency(past.total)}</span>
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-high border border-border uppercase text-on-surface-variant">
                      {past.status === 'completed' ? 'Served' : past.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
