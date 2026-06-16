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
import { cn } from "../lib/utils.js";
import { filterMenuNodes } from "../lib/public-order/filterMenuNodes.js";

function PublicOrderPageInner() {
  const { restaurantRef } = useParams();
  const { context, loading, lookupError, tableQuery, menuIsReady, handleLookup: lookupByInput } =
    useTableLookup(restaurantRef);
  const { openNodes, setOpenNodes, openItems, setOpenItems, quantities, setQuantities } =
    useMenuInteraction();
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
  const headerRef = useRef(null);
  const categoryNavRef = useRef(null);
  const cartRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setTableInput(tableQuery);
  }, [tableQuery]);

  const headerH = menuIsReady ? 96 : 56;

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

  function renderMain() {
    if (!tableQuery) {
      return (
        <section className="mx-auto w-[calc(100%-24px)] max-w-md p-6 rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-mono mb-2">Welcome</p>
          <h2 className="text-3xl font-serif italic font-normal leading-tight text-stone-800">Find your table</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            Enter the table number from your table tent or ask staff.
          </p>
          <TableLookupForm
            tableInput={tableInput}
            onTableInputChange={setTableInput}
            onSubmit={handleLookup}
          />
        </section>
      );
    }

    if (loading) {
      return <div className="text-center py-16 text-stone-400 text-sm tracking-wider">Getting the menu ready for table {tableQuery}…</div>;
    }

    if (lookupError) {
      return (
        <section className="mx-auto w-[calc(100%-24px)] max-w-md p-6 rounded-2xl border border-red-200 bg-gradient-to-b from-white to-stone-50 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-mono mb-2">Table lookup</p>
          <h2 className="text-3xl font-serif italic font-normal leading-tight text-stone-800">Hmm, we could not find table {tableQuery}</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">{lookupError}</p>
          <TableLookupForm
            tableInput={tableInput}
            onTableInputChange={setTableInput}
            onSubmit={handleLookup}
          />
        </section>
      );
    }

    if (!menuIsReady) {
      return (
        <section className="mx-auto w-[calc(100%-24px)] max-w-md p-6 rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 shadow-lg">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-mono mb-2">Menu unavailable</p>
          <h2 className="text-3xl font-serif italic font-normal leading-tight text-stone-800">This table is ready, but the menu is empty</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            Ask staff to publish active dishes for this restaurant, then refresh the page.
          </p>
        </section>
      );
    }

    if (displayedRoots.length) {
      return displayedRoots.map(({ node, index }) => (
        <section
          key={`cat-${index + 1}`}
          id={`cat-${index + 1}`}
          className="grid gap-3.5 border border-stone-200 rounded-2xl bg-white shadow-sm overflow-hidden scroll-mt-32"
        >
          <div className="grid gap-2 px-6 pt-6">
            <p className="text-xs uppercase tracking-widest text-amber-700 font-mono">
              {searchTerm ? `"${searchTerm}" in ` : ""}{node.name}
            </p>
            <h2 className="font-serif text-[clamp(28px,4vw,38px)] italic font-normal leading-none text-stone-800">{node.name}</h2>
          </div>
          <MenuNode
            node={node}
            nodeId={`node-${index + 1}`}
            level={1}
            collapsible={false}
            hideHeader
            searchTerm={searchTerm}
          />
        </section>
      ));
    }

    if (filteredRoots.length === 0 && searchTerm) {
      return <div className="text-center py-16 text-stone-400 text-sm tracking-wider">No dishes matched "{searchTerm}". Try a broader search.</div>;
    }

    if (searchTerm) {
      return <div className="text-center py-16 text-stone-400 text-sm tracking-wider">No dishes matched "{searchTerm}" in this category.</div>;
    }

    return <div className="text-center py-16 text-stone-400 text-sm tracking-wider">This category has no items.</div>;
  }

  return (
    <div
      className="min-h-dvh bg-stone-50 text-stone-800 font-sans text-sm leading-relaxed overflow-x-hidden"
      style={{ '--cart-strip-h': cartItems.count > 0 ? '88px' : '0px' }}
    >
      <FlashStack flash={flash} onDismiss={() => setFlash(null)} bottom />

      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-40 bg-stone-50/90 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 border-b border-stone-200">
          <h1 className="font-serif text-xl italic font-light tracking-wide text-stone-800">
            {context?.restaurant?.name || restaurantRef || "ODA"}
          </h1>
          {tableQuery ? (
            <span className="text-[11px] font-mono tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              TABLE {context?.tableNumber || tableQuery || "--"}
            </span>
          ) : null}
        </div>

        {menuIsReady ? (
          <div className="flex items-center gap-2.5 px-4 h-10 border-b border-stone-200 bg-stone-100">
            <svg viewBox="0 0 16 16" fill="none" className="w-[14px] h-[14px] shrink-0 text-stone-400">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.2" />
              <line x1="9.7" y1="9.7" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search dishes..."
              autoComplete="off"
              aria-label="Search menu"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder:text-stone-400 shadow-none focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-amber-200 focus-visible:outline-offset-2 rounded h-8 px-0"
            />
          </div>
        ) : null}
      </header>

      <div style={{ paddingTop: headerH }}>
        <MenuCategoryNav
          roots={filteredRoots}
          selectedIndex={selectedCategoryIndex}
          onSelectCategory={selectCategory}
          containerRef={categoryNavRef}
          topOffset={headerH}
        />

        <main className="px-3 py-5 max-w-4xl mx-auto grid gap-4 pb-[calc(var(--cart-strip-h,0px)+20px)]">
          {renderMain()}
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
      className="fixed inset-0 z-50 pointer-events-auto opacity-100 transition-opacity duration-220 focus:outline-none"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Order placed"
        className="absolute left-1/2 top-1/2 w-[calc(100vw-24px)] max-w-md p-6 rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 shadow-2xl -translate-x-1/2 -translate-y-1/2 max-h-[calc(100vh-32px)] overflow-auto"
      >
        <p className="text-xs uppercase tracking-widest text-amber-700 font-mono mb-2">Order placed</p>
        <h2 className="text-3xl font-serif italic font-normal leading-tight text-stone-800">Order #{orderResult.orderId}</h2>
        <p className="mt-3 text-sm text-stone-500 leading-relaxed">
          Table {orderResult.tableNumber} — your order is now pending. The kitchen has been notified.
        </p>
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50 grid gap-2">
          <p className="text-xs uppercase tracking-widest text-amber-700 font-mono">{orderResult.count} item{orderResult.count !== 1 ? "s" : ""}</p>
          <ul className="grid gap-1">
            {orderResult.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-600">
                  <span className="font-mono text-stone-400 mr-1.5">{item.quantity}x</span>
                  {item.name}
                </span>
                <span className="font-mono text-stone-800">{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-sm">
            <span className="text-stone-500 font-serif italic">Total</span>
            <strong className="font-mono text-stone-800">{formatCurrency(orderResult.total)}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2.5 mt-4">
          <Button
            type="button"
            onClick={onDismiss}
            className="flex-1 h-11 rounded-xl bg-amber-700 text-stone-50 hover:bg-amber-800 cursor-pointer"
          >
            Back to menu
          </Button>
        </div>
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
