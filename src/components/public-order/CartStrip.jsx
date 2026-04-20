import { formatCurrency } from "../../lib/format.js";

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
  // CUS-L09: Must review cart before placing order
  function handlePlaceOrder(event) {
    event.preventDefault();

    if (!cartOpen) {
      onToggleOpen(true);
      return;
    }

    onSubmit(event);
  }

  return (
    <>
      <div className={`cart-review${cartOpen && cartItems.count > 0 ? " is-open" : ""}`}>
        <div className="cart-review__backdrop" onClick={() => onToggleOpen(false)} aria-hidden="true" />
        <section className="cart-review__sheet" aria-label="Review your order">
          <div className="cart-review__header">
            <div>
              <span className="cart-review__eyebrow">Your order</span>
              <h2 className="cart-review__title">{cartItems.count} items</h2>
            </div>
            <button type="button" className="cart-review__close" onClick={() => onToggleOpen(false)}>
              Close
            </button>
          </div>

          <div className="cart-review__items">
            {cartItems.items.map((item) => (
              <article key={item.id} className="cart-review__item">
                <div>
                  <h3 className="cart-review__item-name">{item.name}</h3>
                  <p className="cart-review__item-total">{formatCurrency(item.subtotal)}</p>
                </div>
                <div className="qty-row" role="group" aria-label={`Quantity for ${item.name}`}>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onAdjustItemQuantity(item.id, -1)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg viewBox="0 0 14 14" fill="none">
                      <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                    </svg>
                  </button>
                  <output className="qty-val mono" aria-live="polite">
                    {item.quantity}
                  </output>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onAdjustItemQuantity(item.id, 1)}
                    disabled={item.quantity >= 20}
                    aria-label={`Add ${item.name}`}
                  >
                    <svg viewBox="0 0 14 14" fill="none">
                      <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                      <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Submit from review sheet */}
          <div className="cart-review__footer">
            <form onSubmit={onSubmit}>
              <button type="submit" className="order-btn order-btn--wide" disabled={cartItems.count === 0 || submitting}>
                {submitting ? "Placing..." : `Place Order — ${formatCurrency(cartItems.total)}`}
              </button>
            </form>
          </div>
        </section>
      </div>

      <aside
        ref={containerRef}
        className={`cart-strip${cartItems.count > 0 ? " is-visible" : ""}`}
        aria-label="Your order"
        aria-live="polite"
      >
        <button
          type="button"
          className="cart-strip__info"
          onClick={() => onToggleOpen(!cartOpen)}
          aria-expanded={cartOpen ? "true" : "false"}
        >
          <span className="cart-strip__count">
            <span>{cartItems.count}</span> items
          </span>
          <strong className="cart-strip__total mono">
            <span>{formatCurrency(cartItems.total)}</span>
          </strong>
          <span className="cart-strip__summary">
            {visibleSummary || "Tap to review"}
            <svg className="cart-strip__chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <form onSubmit={handlePlaceOrder}>
          <button type="submit" className="order-btn" disabled={cartItems.count === 0 || submitting}>
            {submitting ? "Placing..." : cartOpen ? "Place Order" : "Review Order"}
          </button>
        </form>
      </aside>
    </>
  );
}
