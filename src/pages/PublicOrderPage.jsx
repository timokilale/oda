import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import FlashStack from "../components/FlashStack.jsx";
import CartStrip from "../components/public-order/CartStrip.jsx";
import MenuCategoryNav from "../components/public-order/MenuCategoryNav.jsx";
import MenuNode from "../components/public-order/MenuNode.jsx";
import TableLookupForm from "../components/public-order/TableLookupForm.jsx";
import { apiRequest } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";
import { filterMenuNodes } from "../lib/public-order/filterMenuNodes.js";
import "../template-order.css";

export default function PublicOrderPage() {
  const { restaurantRef } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableQuery = searchParams.get("table") || "";
  const [tableInput, setTableInput] = useState(tableQuery);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(Boolean(tableQuery));
  const [lookupError, setLookupError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [flash, setFlash] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [openNodes, setOpenNodes] = useState(new Set());
  const [openItems, setOpenItems] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("cat-1");
  const [cartOpen, setCartOpen] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const headerRef = useRef(null);
  const categoryNavRef = useRef(null);
  const cartRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const previousClassName = document.body.className;
    document.body.className = "";

    return () => {
      document.body.className = previousClassName;
      document.documentElement.style.removeProperty("--order-header-h");
      document.documentElement.style.removeProperty("--order-cat-h");
      document.documentElement.style.removeProperty("--cart-strip-h");
    };
  }, []);

  useEffect(() => {
    setTableInput(tableQuery);
  }, [tableQuery]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (!tableQuery) {
        if (!active) {
          return;
        }

        setContext(null);
        setLoading(false);
        setLookupError("");
        setSearchTerm("");
        setSearchOpen(false);
        setOpenNodes(new Set());
        setOpenItems(new Set());
        setQuantities({});
        setCartOpen(false);
        setOrderResult(null);
        return;
      }

      setLoading(true);
      setFlash(null);
      setLookupError("");
      setOrderResult(null);

      try {
        const data = await apiRequest(
          `/public/restaurants/${encodeURIComponent(restaurantRef)}/order-context?table=${encodeURIComponent(tableQuery)}`,
        );

        if (!active) {
          return;
        }

        setContext(data);
        setSearchTerm("");
        setSearchOpen(false);
        setOpenNodes(new Set());
        setOpenItems(new Set());
        setQuantities({});
        setCartOpen(false);
      } catch (error) {
        if (!active) {
          return;
        }

        setContext(null);
        setLookupError(error.message);
        setFlash({ type: "error", message: error.message });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, [restaurantRef, tableQuery]);

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

  useEffect(() => {
    if (!filteredRoots.length) {
      setActiveSectionId("");
      return;
    }

    const hasActiveSection = filteredRoots.some(({ index }) => `cat-${index + 1}` === activeSectionId);
    if (!hasActiveSection) {
      setActiveSectionId(`cat-${filteredRoots[0].index + 1}`);
    }
  }, [activeSectionId, filteredRoots]);

  const cartItems = useMemo(() => {
    const items = [];
    let count = 0;
    let total = 0;

    (context?.menuItems || []).forEach((item) => {
      const quantity = Number(quantities[String(item.id)] || 0);
      if (!quantity) {
        return;
      }

      count += quantity;
      total += quantity * Number(item.price || 0);
      items.push({
        id: item.id,
        name: item.name,
        quantity,
        subtotal: quantity * Number(item.price || 0),
      });
    });

    return { items, count, total };
  }, [context, quantities]);

  const menuIsReady = Boolean(context?.menuItems?.length);

  useEffect(() => {
    function updateCssVariables() {
      document.documentElement.style.setProperty(
        "--order-header-h",
        `${headerRef.current?.offsetHeight || 0}px`,
      );
      document.documentElement.style.setProperty(
        "--order-cat-h",
        `${menuIsReady ? categoryNavRef.current?.offsetHeight || 0 : 0}px`,
      );
      document.documentElement.style.setProperty(
        "--cart-strip-h",
        `${cartItems.count > 0 ? cartRef.current?.offsetHeight || 0 : 0}px`,
      );
    }

    updateCssVariables();

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => updateCssVariables())
        : null;

    for (const node of [headerRef.current, categoryNavRef.current, cartRef.current]) {
      if (node && resizeObserver) {
        resizeObserver.observe(node);
      }
    }

    window.addEventListener("resize", updateCssVariables);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateCssVariables);
    };
  }, [cartItems.count, menuIsReady, searchOpen]);

  useEffect(() => {
    if (!menuIsReady || !filteredRoots.length) {
      return undefined;
    }

    let frameId = 0;

    function syncActiveSection() {
      frameId = 0;

      const offset =
        (headerRef.current?.offsetHeight || 0) +
        (categoryNavRef.current?.offsetHeight || 0) +
        16;
      let nextSectionId = `cat-${filteredRoots[0].index + 1}`;

      for (const { index } of filteredRoots) {
        const sectionId = `cat-${index + 1}`;
        const section = document.getElementById(sectionId);

        if (section && section.getBoundingClientRect().top <= offset) {
          nextSectionId = sectionId;
        }
      }

      setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
    }

    function handleScroll() {
      if (!frameId) {
        frameId = window.requestAnimationFrame(syncActiveSection);
      }
    }

    syncActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [filteredRoots, menuIsReady]);

  function updateQuantity(itemId, delta) {
    setQuantities((current) => {
      const nextValue = Math.max(0, Math.min(20, Number(current[String(itemId)] || 0) + delta));
      return { ...current, [String(itemId)]: nextValue };
    });
  }

  function handleLookup(event) {
    event.preventDefault();
    setFlash(null);
    setLookupError("");
    setSearchParams(tableInput.trim() ? { table: tableInput.trim() } : {});
  }

  function jumpToSection(index) {
    const sectionId = `cat-${index + 1}`;
    setActiveSectionId(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
        count: cartItems.count,
        total: cartItems.total,
        summary: visibleSummary,
      });
      setQuantities({});
      setOpenItems(new Set());
      setCartOpen(false);
      setFlash({ type: "success", message: response.successMessage });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSummary =
    cartItems.items.length === 0
      ? ""
      : cartItems.items.length === 1
        ? cartItems.items[0].name
        : `${cartItems.items[0].name} + ${cartItems.items.length - 1} more`;

  return (
    <div className="order-page">
      <div className="shell" data-page>
        <FlashStack flash={flash} onDismiss={() => setFlash(null)} bottom />

        <header className="site-header" ref={headerRef}>
          <div className="site-header__inner">
            <h1 className="site-header__name">{context?.restaurant?.name || "ODA"}</h1>
            <div className="site-header__right">
              {tableQuery ? (
                <span className="table-chip">TABLE {context?.tableNumber || tableQuery || "--"}</span>
              ) : null}
              {menuIsReady ? (
                <button
                  type="button"
                  className="search-btn"
                  aria-expanded={searchOpen ? "true" : "false"}
                  aria-label="Toggle search"
                  onClick={() => setSearchOpen((current) => !current)}
                >
                  <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                    <line x1="9.7" y1="9.7" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          {menuIsReady ? (
            <div className={`search-bar${searchOpen ? " is-open" : ""}`}>
              <div className="search-bar__inner">
                <input
                  ref={searchInputRef}
                  className="search-input"
                  type="search"
                  placeholder="Search dishes..."
                  autoComplete="off"
                  aria-label="Search menu"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          ) : null}
        </header>

        <MenuCategoryNav
          roots={filteredRoots}
          activeSectionId={activeSectionId}
          onJumpToSection={jumpToSection}
          containerRef={categoryNavRef}
        />

        <main className="main-content" id="main">
          {!tableQuery ? (
            <section className="lookup-card">
              <p className="lookup-card__eyebrow">Customer</p>
              <h2 className="lookup-card__title">Find your table</h2>
              <p className="lookup-card__subtitle">
                Scan the QR code on your table. If no QR is available, enter the table number printed on your table tent or ask staff.
              </p>
              <TableLookupForm
                tableInput={tableInput}
                onTableInputChange={setTableInput}
                onSubmit={handleLookup}
              />
            </section>
          ) : loading ? (
            <div className="empty-zone">Loading menu for table {tableQuery}...</div>
          ) : lookupError ? (
            <section className="lookup-card lookup-card--error">
              <p className="lookup-card__eyebrow">Table lookup</p>
              <h2 className="lookup-card__title">We could not verify that table</h2>
              <p className="lookup-card__subtitle">{lookupError}</p>
              <TableLookupForm
                tableInput={tableInput}
                onTableInputChange={setTableInput}
                onSubmit={handleLookup}
              />
            </section>
          ) : !menuIsReady ? (
            <section className="lookup-card">
              <p className="lookup-card__eyebrow">Menu unavailable</p>
              <h2 className="lookup-card__title">This table is ready, but the menu is empty</h2>
              <p className="lookup-card__subtitle">
                Ask staff to publish active dishes for this restaurant, then refresh the page.
              </p>
            </section>
          ) : filteredRoots.length ? (
            filteredRoots.map(({ node, index }) => {
              const sectionId = `cat-${index + 1}`;
              return (
                <section
                  key={sectionId}
                  id={sectionId}
                  className="root-section"
                  aria-label={node.name}
                >
                  <MenuNode
                    node={node}
                    nodeId={`node-${index + 1}`}
                    level={1}
                    collapsible={false}
                    showGhost
                    searchTerm={searchTerm}
                    openNodes={openNodes}
                    setOpenNodes={setOpenNodes}
                    openItems={openItems}
                    setOpenItems={setOpenItems}
                    quantities={quantities}
                    setQuantities={setQuantities}
                  />
                </section>
              );
            })
          ) : (
            <div className="empty-zone">No dishes matched "{searchTerm}". Try a broader search.</div>
          )}
        </main>

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

        {orderResult ? (
          <div
            className="order-success"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOrderResult(null);
              }
            }}
          >
            <div className="order-success__backdrop" onClick={() => setOrderResult(null)} aria-hidden="true" />
            <section className="order-success__dialog" role="dialog" aria-modal="true" aria-label="Order placed">
              <p className="order-success__eyebrow">Order placed</p>
              <h2 className="order-success__title">Order #{orderResult.orderId}</h2>
              <p className="order-success__copy">
                Table {orderResult.tableNumber} — your order is now pending. The kitchen has been notified.
              </p>
              <div className="order-success__summary">
                <span>{orderResult.count} items</span>
                <strong>{orderResult.summary || "Order submitted"}</strong>
                <span>{formatCurrency(orderResult.total)}</span>
              </div>
              <div className="action-row">
                <button type="button" className="order-btn" onClick={() => setOrderResult(null)}>
                  Back to menu
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
