import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import FlashStack from "../components/FlashStack.jsx";
import CartStrip from "../components/public-order/CartStrip.jsx";
import MenuCategoryNav from "../components/public-order/MenuCategoryNav.jsx";
import MenuNode from "../components/public-order/MenuNode.jsx";
import TableLookupForm from "../components/public-order/TableLookupForm.jsx";
import { MenuInteractionProvider, useMenuInteraction } from "../context/MenuInteractionContext.jsx";
import { useCart } from "../hooks/useCart.js";
import { useTableLookup } from "../hooks/useTableLookup.js";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { filterMenuNodes } from "../lib/public-order/filterMenuNodes.js";

const ORDER_LABELS = {
  pending: { label: "Waiting", icon: "🕐", color: "text-amber-600 bg-amber-50 border-amber-200" },
  confirmed: { label: "Cooking", icon: "👨‍🍳", color: "text-orange-600 bg-orange-50 border-orange-200" },
  completed: { label: "Served", icon: "✅", color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelled", icon: "—", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

function orderStatusMeta(status) {
  return ORDER_LABELS[status] || ORDER_LABELS.pending;
}

function TabBar({ activeTab, onTabChange, tableNumber }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {[
        { value: "menu", label: "Menu" },
        { value: "status", label: "Status" },
      ].map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={`inline-flex items-center justify-center h-8 px-4 rounded text-sm font-medium transition-colors ${
            activeTab === tab.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.value === "status" && tableNumber ? (
            <LiveDot />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
  );
}

function OrderStatusView({ restaurantRef, tableQuery, onNewOrder }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(
        `/public/restaurants/${encodeURIComponent(restaurantRef)}/orders?table=${encodeURIComponent(tableQuery)}`
      );
      setOrders(data.orders || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [restaurantRef, tableQuery]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
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
          className="mt-4 inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Order #{order.id}
          <span className="ml-2 font-mono font-normal normal-case">{created}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-medium border ${orderMeta.color}`}
        >
          <span>{orderMeta.icon}</span>
          <span>{orderMeta.label}</span>
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
  const { setOpenItems, quantities, setQuantities } = useMenuInteraction();
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

  const headerH = menuIsReady ? 134 : 56;

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
      <section className="mx-auto w-[calc(100%-24px)] max-w-md mt-8 p-6 rounded-2xl border border-border bg-card shadow-sm">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${tone === "error" ? "text-destructive" : "text-primary"}`}>
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold leading-tight text-foreground text-balance">{title}</h2>
        <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </section>
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
      return (
        <div className="flex flex-col gap-4">
          {displayedRoots.map(({ node, index }) => (
            <section
              key={`cat-${index + 1}`}
              id={`cat-${index + 1}`}
              className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden scroll-mt-32"
            >
              <div className="px-4 pt-4 pb-1">
                {searchTerm ? (
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Results in {node.name}
                  </p>
                ) : null}
                <h2 className="text-xl font-bold text-foreground">{node.name}</h2>
              </div>
              <MenuNode node={node} nodeId={`node-${index + 1}`} level={1} collapsible={false} hideHeader searchTerm={searchTerm} />
            </section>
          ))}
        </div>
      );
    }

    if (searchTerm) {
      return <div className="text-center py-20 text-muted-foreground text-sm">No items matched “{searchTerm}”. Try a broader search.</div>;
    }

    return <div className="text-center py-20 text-muted-foreground text-sm">This category has no items.</div>;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans text-sm leading-relaxed overflow-x-hidden">
      <FlashStack flash={flash} onDismiss={() => setFlash(null)} bottom />

      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              {context?.restaurant?.name || restaurantRef || "ODA"}
            </h1>
            {tableQuery ? (
              <span className="shrink-0 text-xs font-semibold font-mono tracking-wide text-primary bg-accent rounded-full px-3 py-1">
                Table {context?.tableNumber || tableQuery || "--"}
              </span>
            ) : null}
          </div>

          {tableQuery ? (
            <div className="px-4 pb-3">
              <TabBar activeTab={activeTab} onTabChange={setActiveTab} tableNumber={tableQuery} />
            </div>
          ) : null}

          {menuIsReady && activeTab === "menu" ? (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-muted">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0 text-muted-foreground">
                  <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                  <line x1="9.7" y1="9.7" x2="13" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search menu..."
                  autoComplete="off"
                  aria-label="Search menu"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 h-9 px-0"
                />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div style={{ paddingTop: headerH }}>
        {menuIsReady && activeTab === "menu" ? (
          <MenuCategoryNav
            roots={filteredRoots}
            selectedIndex={selectedCategoryIndex}
            onSelectCategory={selectCategory}
            containerRef={categoryNavRef}
            topOffset={headerH}
          />
        ) : null}

        <main className="px-3 py-4 max-w-4xl mx-auto pb-28">
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
        <h2 className="text-2xl font-semibold leading-tight text-foreground">Order #{orderResult.orderId}</h2>
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
          className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
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
