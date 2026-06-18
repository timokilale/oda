import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import FlashStack from "../components/FlashStack.jsx";
import CartStrip from "../components/public-order/CartStrip.jsx";
import MenuCategoryNav from "../components/public-order/MenuCategoryNav.jsx";

import TableLookupForm from "../components/public-order/TableLookupForm.jsx";
import { MenuInteractionProvider, useMenuInteraction } from "../context/MenuInteractionContext.jsx";
import { useCart } from "../hooks/useCart.js";
import { useTableLookup } from "../hooks/useTableLookup.js";
import { Button } from "../components/ui/button.jsx";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { filterMenuNodes } from "../lib/public-order/filterMenuNodes.js";

const ORDER_LABELS = {
  pending: { label: "Pending", color: "bg-warning/15 text-warning" },
  confirmed: { label: "Cooking", color: "bg-warning/15 text-warning" },
  completed: { label: "Served", color: "bg-success/15 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/15 text-destructive" },
};

function orderStatusMeta(status) {
  return ORDER_LABELS[status] || ORDER_LABELS.pending;
}

function TabBar({ activeTab, onTabChange, searchTerm, onSearchChange, searchInputRef }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
      <button
        type="button"
        onClick={() => onTabChange("menu")}
        className={`inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${
          activeTab === "menu"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Menu
      </button>

      {activeTab === "menu" ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0 text-muted-foreground">
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <line x1="9.7" y1="9.7" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search menu..."
            autoComplete="off"
            aria-label="Search menu"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onTabChange("status")}
        className={`inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium transition-colors shrink-0 ${
          activeTab === "status"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Status
        {activeTab === "status" ? <LiveDot /> : null}
      </button>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
  );
}

function OrderStatusView({ restaurantRef, tableQuery, onNewOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(
        `/public/restaurants/${encodeURIComponent(restaurantRef)}/orders?table=${encodeURIComponent(tableQuery)}`
      );
      if (mounted.current) setOrders(data.orders || []);
    } catch {
      // silent
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantRef, tableQuery]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-muted-foreground/50">
            <path d="M3 9h18M9 3v6m6-6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="4" y="9" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">No orders yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Place an order from the Menu tab and it will appear here.
        </p>
        <button
          type="button"
          onClick={onNewOrder}
          className="mt-4 inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          Browse menu
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  const orderMeta = orderStatusMeta(order.status);
  const created = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_3px_0_rgba(30,27,75,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Order #{order.id}
          <span className="ml-2 font-mono font-normal normal-case">{created}</span>
        </div>
        <span
          className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold ${orderMeta.color}`}
        >
          {orderMeta.label}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              <span className="font-mono text-muted-foreground mr-1.5">{item.quantity}×</span>
              {item.name}
            </span>
            <span className="font-mono text-foreground">{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {order.totalAmount > 0 ? (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-sm">
          <span className="text-muted-foreground font-medium">Total</span>
          <strong className="font-mono text-foreground">{formatCurrency(order.totalAmount)}</strong>
        </div>
      ) : null}
    </div>
  );
}

function PublicOrderPageInner() {
  const { restaurantRef } = useParams();
  const { context, loading, lookupError, tableQuery, menuIsReady, handleLookup: lookupByInput } =
    useTableLookup(restaurantRef);
  const { openItems, setOpenItems, quantities, setQuantities } = useMenuInteraction();
  const { cartItems, visibleSummary, updateQuantity, clearCart } = useCart(
    context?.menuItems,
    quantities,
    setQuantities,
  );

  const [tableInput, setTableInput] = useState(tableQuery);
  const [searchTerm, setSearchTerm] = useState("");
  const [flash, setFlash] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [detailedView, setDetailedView] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [activeTab, setActiveTab] = useState("menu");
  const headerRef = useRef(null);
  const categoryNavRef = useRef(null);
  const cartRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setTableInput(tableQuery);
  }, [tableQuery]);

  const [headerHeight, setHeaderHeight] = useState(56 + (tableQuery ? 44 : 0));

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeaderHeight(entry.contentRect.height);
    });
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const filteredRoots = useMemo(
    () =>
      (context?.menuTree || [])
        .map((node, index) => ({
          node: searchTerm.trim()
            ? filterMenuNodes([node], searchTerm.trim().toLowerCase())[0] || null
            : node,
          index,
        }))
        .filter((entry) => entry.node),
    [context, searchTerm],
  );

  const displayedRoots = useMemo(
    () =>
      selectedCategoryIndex == null
        ? filteredRoots
        : filteredRoots.filter((entry) => entry.index === selectedCategoryIndex),
    [filteredRoots, selectedCategoryIndex],
  );

  function handleLookup(event) {
    event.preventDefault();
    setFlash(null);
    lookupByInput(tableInput);
  }

  function selectCategory(index) {
    setSelectedCategoryIndex((prev) => (prev === index ? null : index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFlash(null);

    try {
      const response = await apiRequest(`/public/restaurants/${encodeURIComponent(restaurantRef)}/orders`, {
        method: "POST",
        body: {
          tableNumber: context?.tableNumber || tableQuery,
          items: cartItems.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        },
      });
      setOrderResult({
        orderId: response.orderId,
        tableNumber: response.tableNumber,
        items: cartItems.items,
        count: cartItems.count,
        total: cartItems.total,
      });
      clearCart();
      setOpenItems(new Set());
      setCartOpen(false);
      setFlash({ type: "success", message: response.successMessage });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function InfoCard({ eyebrow, title, children, tone = "default" }) {
    return (
      <section className="mx-auto w-[calc(100%-24px)] max-w-md mt-8 p-6 rounded-xl border border-border bg-card shadow-[0_1px_3px_0_rgba(30,27,75,0.04)]">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tone === "error" ? "text-destructive" : "text-primary"}`}>
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold leading-tight text-foreground text-balance">{title}</h2>
        <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </section>
    );
  }

  function MenuItemCard({ item, index }) {
    const itemId = String(item.id);
    const qty = Number(quantities[itemId] || 0);
    const isSelected = qty > 0;

    function changeQuantity(delta) {
      setQuantities((prev) => {
        const current = Number(prev[itemId] || 0);
        const next = Math.max(0, Math.min(20, current + delta));
        return { ...prev, [itemId]: next };
      });
    }

    return (
      <div
        className="rounded-xl border border-border bg-card overflow-hidden opacity-0 translate-y-1 animate-[cardIn_300ms_ease-out_both] shadow-[0_1px_3px_0_rgba(30,27,75,0.04)]"
        style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.name}
              crossOrigin="anonymous"
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%` }}
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-muted-foreground" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <path d="M4 7h16v12H4z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 18l5-4 3 2 3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
          )}
          {qty === 0 ? (
            <button
              type="button"
              onClick={() => changeQuantity(1)}
              aria-label={`Add ${item.name}`}
              className="absolute bottom-2 right-2 grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-transform duration-150 active:scale-90 cursor-pointer"
            >
              <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-semibold text-foreground leading-tight">{item.name}</h3>
            {isSelected ? (
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold font-mono leading-none animate-[badgePop_200ms_ease-out_both] shrink-0">
                {qty}
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-primary">{formatCurrency(item.price)}</span>
            {isSelected ? (
              <div className="flex items-center gap-0.5 h-9 px-1 rounded-full bg-muted animate-[badgePop_180ms_ease-out_both]">
                <button
                  type="button"
                  onClick={() => changeQuantity(-1)}
                  aria-label={`Remove one ${item.name}`}
                  className="grid place-items-center w-7 h-7 rounded-full text-foreground hover:bg-accent transition-colors active:scale-90 cursor-pointer"
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
                <output className="min-w-5 text-center text-sm font-semibold text-foreground font-mono" aria-live="polite">{qty}</output>
                <button
                  type="button"
                  onClick={() => changeQuantity(1)}
                  disabled={qty >= 20}
                  aria-label={`Add one ${item.name}`}
                  className="grid place-items-center w-7 h-7 rounded-full text-primary hover:bg-accent transition-colors active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
                    <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function renderMain() {
    if (!tableQuery) {
      return (
        <InfoCard eyebrow="Welcome" title="Find your table">
          <p>Enter the table number from your table tent.</p>
          <div className="mt-4">
            <TableLookupForm tableInput={tableInput} onTableInputChange={setTableInput} onSubmit={handleLookup} />
          </div>
        </InfoCard>
      );
    }

    if (loading) {
      return <div className="text-center py-20 text-muted-foreground text-sm">Getting the menu ready for table {tableQuery}…</div>;
    }

    if (lookupError) {
      return (
        <InfoCard eyebrow="Table lookup" tone="error" title={`We couldn't find table ${tableQuery}`}>
          <p>{lookupError}</p>
          <div className="mt-4">
            <TableLookupForm tableInput={tableInput} onTableInputChange={setTableInput} onSubmit={handleLookup} />
          </div>
        </InfoCard>
      );
    }

    if (!menuIsReady) {
      return (
        <InfoCard eyebrow="Menu unavailable" title="This table is ready, but the menu is empty">
          <p>Ask staff to add items to the menu, then refresh the page.</p>
        </InfoCard>
      );
    }

    if (displayedRoots.length) {
      const allItems = displayedRoots.flatMap(({ node }) => node.items || []);
      if (detailedView) {
        return <DetailedView items={allItems} />;
      }
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {allItems.map((item, index) => (
            <MenuItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      );
    }

    if (searchTerm) {
      return <div className="text-center py-20 text-muted-foreground text-sm">No items matched “{searchTerm}”. Try a broader search.</div>;
    }

    return <div className="text-center py-20 text-muted-foreground text-sm">This category has no items.</div>;
  }

  function DetailedView({ items }) {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef(0);
    const item = items[index];
    const itemId = item ? String(item.id) : null;
    const qty = itemId ? Number(quantities[itemId] || 0) : 0;
    const isSelected = qty > 0;
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
      let start = performance.now();
      let raf = requestAnimationFrame(function tick(now) {
        setRotation(((now - start) * 0.12) % 360);
        raf = requestAnimationFrame(tick);
      });
      return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
      setIndex(0);
    }, [items]);

    useEffect(() => {
      function handleKeyDown(e) {
        if (e.key === "ArrowLeft") prev();
        else if (e.key === "ArrowRight") next();
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [items.length]);

    function prev() {
      setIndex((i) => (i > 0 ? i - 1 : items.length - 1));
    }

    function next() {
      setIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    }

    function handleTouchStart(e) {
      touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) next();
        else prev();
      }
    }

    function changeQuantity(delta) {
      if (!itemId) return;
      setQuantities((prev) => {
        const current = Number(prev[itemId] || 0);
        const next = Math.max(0, Math.min(20, current + delta));
        return { ...prev, [itemId]: next };
      });
    }

    if (!item) return null;

    return (
      <div
        className="rounded-2xl bg-card overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-[45dvh] min-h-[280px] bg-gradient-to-b from-primary/[0.04] via-background to-background overflow-visible flex items-center justify-center">
          <div
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-full ring-[8px] ring-border/20 shadow-2xl overflow-hidden bg-muted"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: `${item.imagePositionX ?? 50}% ${item.imagePositionY ?? 50}%` }}
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12">
                  <path d="M4 7h16v12H4z" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5 18l5-4 3 2 3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        </div>

        <div className="relative -mt-20 px-5 pb-8 pt-24 bg-card">
          <div className="text-center max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">{item.name}</h2>
              {isSelected ? (
                <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold font-mono animate-[badgePop_200ms_ease-out_both]">{qty}</span>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-lg font-semibold text-primary">{formatCurrency(item.price)}</p>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {item.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {isSelected ? (
              <div className="flex items-center gap-1.5 h-11 px-3 rounded-full bg-muted">
                <button
                  type="button"
                  onClick={() => changeQuantity(-1)}
                  className="grid place-items-center w-9 h-9 rounded-full text-foreground hover:bg-accent transition-colors active:scale-90 cursor-pointer"
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
                <output className="min-w-7 text-center text-lg font-semibold text-foreground font-mono" aria-live="polite">{qty}</output>
                <button
                  type="button"
                  onClick={() => changeQuantity(1)}
                  disabled={qty >= 20}
                  className="grid place-items-center w-9 h-9 rounded-full text-primary hover:bg-accent transition-colors active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                    <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => changeQuantity(1)}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                  <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
                Add to order
              </button>
            )}
            {qty >= 20 ? <span className="text-xs text-muted-foreground">Max 20</span> : null}
          </div>

          <div className="mt-5 flex items-center justify-center gap-1">
            <span className="text-xs text-muted-foreground">Swipe</span>
            <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-muted-foreground">
              <path d="M5 3L2 7l3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 3l3 4-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-medium text-muted-foreground font-mono tabular-nums">{index + 1}/{items.length}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans text-sm leading-relaxed overflow-x-hidden">
      <FlashStack flash={flash} onDismiss={() => setFlash(null)} bottom />

      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              {context?.restaurant?.name || restaurantRef || "ODA"}
            </h1>
            {tableQuery ? (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs font-semibold font-mono tracking-wide text-primary bg-accent rounded-full px-3 py-1">
                  Table {context?.tableNumber || tableQuery || "--"}
                </span>
                {activeTab === "menu" && filteredRoots.length ? (
                  <button
                    type="button"
                    onClick={() => { setDetailedView((v) => !v); setDetailIndex(0); }}
                    className="shrink-0 text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
                  >
                    {detailedView ? "Grid" : "Browse"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {tableQuery ? (
            <div className="px-4 pb-3">
              <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchInputRef={searchInputRef}
              />
            </div>
          ) : null}
        </div>

        {menuIsReady && activeTab === "menu" && filteredRoots.length ? (
          <div>
            <MenuCategoryNav
              roots={filteredRoots}
              selectedIndex={selectedCategoryIndex}
              onSelectCategory={selectCategory}
              containerRef={categoryNavRef}
              topOffset={0}
            />
          </div>
        ) : null}
      </header>

      <div style={{ paddingTop: headerHeight }}>
        <main className="px-4 py-4 max-w-4xl mx-auto pb-28">
          {tableQuery && activeTab === "status" ? (
            <OrderStatusView
              restaurantRef={restaurantRef}
              tableQuery={context?.tableNumber || tableQuery}
              onNewOrder={() => setActiveTab("menu")}
            />
          ) : (
            renderMain()
          )}
        </main>
      </div>

      <CartStrip
        cartItems={cartItems}
        visibleSummary={visibleSummary}
        submitting={submitting}
        cartOpen={cartOpen}
        onSubmit={handleSubmit}
        onToggleOpen={setCartOpen}
        onAdjustItemQuantity={updateQuantity}
        containerRef={cartRef}
      />

      {orderResult ? <OrderResultDialog orderResult={orderResult} onDismiss={() => setOrderResult(null)} /> : null}
    </div>
  );
}

function OrderResultDialog({ orderResult, onDismiss }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onDismiss();
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    const el = dialogRef.current;
    el?.addEventListener("keydown", handleKeyDown);
    return () => el?.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 pointer-events-auto animate-[fadeIn_180ms_ease-out] focus:outline-none"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Order placed"
        className="absolute left-1/2 top-1/2 w-[calc(100vw-24px)] max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl -translate-x-1/2 -translate-y-1/2 max-h-[calc(100vh-32px)] overflow-auto"
      >
        <div className="grid place-items-center w-12 h-12 rounded-full bg-success/15 text-success mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <polyline points="5,13 10,18 19,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Order placed</p>
        <h2 className="text-xl font-semibold leading-tight text-foreground">Order #{orderResult.orderId}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Table {orderResult.tableNumber} — your order is pending.
        </p>
        <div className="mt-4 p-4 rounded-xl bg-muted">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {orderResult.count} item{orderResult.count !== 1 ? "s" : ""}
          </p>
          <ul className="flex flex-col gap-1.5">
            {orderResult.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  <span className="font-mono text-muted-foreground mr-1.5">{item.quantity}×</span>
                  {item.name}
                </span>
                <span className="font-mono text-foreground">{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-sm">
            <span className="text-muted-foreground font-medium">Total</span>
            <strong className="font-mono text-foreground">{formatCurrency(orderResult.total)}</strong>
          </div>
        </div>
        <Button
          type="button"
          onClick={onDismiss}
          className="w-full h-12 mt-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          Back to menu
        </Button>
      </section>
    </div>
  );
}

export default function PublicOrderPage() {
  return (
    <MenuInteractionProvider>
      <PublicOrderPageInner />
    </MenuInteractionProvider>
  );
}
