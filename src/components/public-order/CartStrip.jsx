import { Button } from "../ui/button.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet.jsx";
import { formatCurrency } from "../../lib/format.js";
import { cn } from "../../lib/utils.js";

function CartSheet({ cartItems, submitting, onPlaceOrder, onAdjustItemQuantity }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {cartItems.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 py-3 border-t border-stone-100 first:border-t-0 first:pt-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif italic text-lg text-stone-800 truncate">{item.name}</h3>
              <p className="text-xs text-stone-500 font-mono">{formatCurrency(item.subtotal)}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0" role="group" aria-label={`Quantity for ${item.name}`}>
              <button
                type="button"
                onClick={() => onAdjustItemQuantity(item.id, -1)}
                aria-label={`Remove ${item.name}`}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150 active:scale-[0.92] cursor-pointer"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                  <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              </button>
              <output className="text-lg font-medium text-stone-800 min-w-8 text-center font-mono" aria-live="polite">
                {item.quantity}
              </output>
              <button
                type="button"
                onClick={() => onAdjustItemQuantity(item.id, 1)}
                disabled={item.quantity >= 20}
                aria-label={`Add ${item.name}`}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-150 active:scale-[0.92] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                  <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                  <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onPlaceOrder} className="pt-3 border-t border-stone-200">
        <Button
          type="submit"
          disabled={cartItems.count === 0 || submitting}
          className="w-full h-11 rounded-xl bg-amber-700 text-stone-50 hover:bg-amber-800 text-sm cursor-pointer"
        >
          {submitting ? "Placing..." : `Place Order — ${formatCurrency(cartItems.total)}`}
        </Button>
      </form>
    </div>
  );
}

export default function CartStrip({
  cartItems,
  visibleSummary,
  submitting,
  cartOpen,
  onSubmit,
  onToggleOpen,
  onAdjustItemQuantity,
  containerRef,
}) {
  if (cartItems.count === 0) return null;

  return (
    <>
      <Sheet open={cartOpen} onOpenChange={onToggleOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl border-stone-200 bg-stone-50 pb-safe">
          <SheetHeader>
            <SheetTitle className="text-xs uppercase tracking-widest text-stone-500 font-mono">
              Your order
            </SheetTitle>
          </SheetHeader>
          <div className="mt-2">
            <h2 className="font-serif italic text-2xl text-stone-800 mb-4">{cartItems.count} items</h2>
            <CartSheet
              cartItems={cartItems}
              submitting={submitting}
              onPlaceOrder={onSubmit}
              onAdjustItemQuantity={onAdjustItemQuantity}
            />
          </div>
        </SheetContent>
      </Sheet>

      <aside
        ref={containerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-stone-50/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center gap-3"
        aria-label="Your order"
        aria-live="polite"
      >
        <button
          type="button"
          onClick={() => onToggleOpen(!cartOpen)}
          aria-expanded={cartOpen}
          className="flex-1 min-w-0 text-left border-none bg-transparent p-0 cursor-pointer"
        >
          <span className="block text-xs uppercase tracking-wider text-stone-500">
            {cartItems.count} items
          </span>
          <strong className="block text-lg font-medium text-stone-800 font-mono">
            {formatCurrency(cartItems.total)}
          </strong>
          {visibleSummary ? (
            <span className={cn(
              "block font-serif italic text-sm text-stone-500 truncate",
              "after:inline-block after:w-3 after:h-3 after:ml-1 after:align-middle",
              "after:[content:'''] after:[mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%23999' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] after:[mask-size:12px_12px] after:bg-stone-400",
              cartOpen && "after:rotate-180",
            )}>
              {visibleSummary}
            </span>
          ) : null}
        </button>
        <Button
          type="button"
          onClick={() => onToggleOpen(!cartOpen)}
          className="h-11 px-5 rounded-xl bg-amber-700 text-stone-50 hover:bg-amber-800 text-sm cursor-pointer shrink-0"
        >
          {cartOpen ? "Close" : "Review Order"}
        </Button>
      </aside>
    </>
  );
}
