import { Button } from "../ui/button.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet.jsx";
import { formatCurrency } from "../../lib/format.js";

function CartSheet({ cartItems, submitting, onPlaceOrder, onAdjustItemQuantity }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        {cartItems.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 py-3 border-t border-border first:border-t-0 first:pt-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate text-[15px]">{item.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{formatCurrency(item.subtotal)}</p>
            </div>
            <div className="flex items-center gap-1 h-9 px-1 rounded-full bg-muted" role="group" aria-label={`Quantity for ${item.name}`}>
              <button
                type="button"
                onClick={() => onAdjustItemQuantity(item.id, -1)}
                aria-label={`Remove one ${item.name}`}
                className="grid place-items-center w-8 h-8 rounded-full text-foreground hover:bg-background transition-colors active:scale-90 cursor-pointer"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                  <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <output className="min-w-6 text-center text-base font-semibold text-foreground font-mono" aria-live="polite">
                {item.quantity}
              </output>
              <button
                type="button"
                onClick={() => onAdjustItemQuantity(item.id, 1)}
                disabled={item.quantity >= 20}
                aria-label={`Add one ${item.name}`}
                className="grid place-items-center w-8 h-8 rounded-full text-primary hover:bg-background transition-colors active:scale-90 disabled:opacity-30 cursor-pointer"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                  <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onPlaceOrder} className="pt-3 border-t border-border">
        <Button
          type="submit"
          disabled={cartItems.count === 0 || submitting}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold"
        >
          {submitting ? "Placing order..." : `Place order  •  ${formatCurrency(cartItems.total)}`}
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
        <SheetContent side="bottom" className="rounded-t-xl border-border bg-card max-h-[80dvh] overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="text-lg font-semibold text-foreground">
              Your order · {cartItems.count} item{cartItems.count !== 1 ? "s" : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="px-5 pb-5">
            <CartSheet
              cartItems={cartItems}
              submitting={submitting}
              onPlaceOrder={onSubmit}
              onAdjustItemQuantity={onAdjustItemQuantity}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
        <aside
          ref={containerRef}
          className="pointer-events-auto max-w-md mx-auto flex items-center gap-3 rounded-xl bg-primary text-primary-foreground px-4 py-3"
          aria-label="Your order"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => onToggleOpen(!cartOpen)}
            aria-expanded={cartOpen}
            className="flex-1 min-w-0 flex items-center gap-3 text-left bg-transparent cursor-pointer"
          >
            <span className="grid place-items-center min-w-7 h-7 px-2 rounded-full bg-primary-foreground/20 text-sm font-semibold font-mono">
              {cartItems.count}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-primary-foreground/80">View order</span>
              {visibleSummary ? (
                <span className="block text-[13px] text-primary-foreground/70 truncate">{visibleSummary}</span>
              ) : null}
            </span>
          </button>
          <strong className="text-base font-semibold font-mono shrink-0">
            {formatCurrency(cartItems.total)}
          </strong>
        </aside>
      </div>
    </>
  );
}
