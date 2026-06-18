import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import OrdersView from "../components/management/OrdersView.jsx";
import { transformApiOrderToView } from "../types/managementTypes.js";

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

export default function OrdersPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [acceptingOrders, setAcceptingOrders] = useState(restaurant.active);
  const [lastOrderIds, setLastOrderIds] = useState(new Set());
  const fallbackRef = useRef(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/orders`);
      const rawOrders = data.orders || [];
      const mapped = rawOrders.map(transformApiOrderToView);

      setOrders(mapped);
      const currentIds = new Set(rawOrders.map((o) => o.id));
      setLastOrderIds((prev) => {
        if (prev.size > 0 && currentIds.size > prev.size) {
          playNotificationSound();
        }
        return currentIds;
      });
    } catch (error) {
      if (!error.message.includes("timed out")) {
        setFlash({ type: "error", message: error.message });
      }
    }
  }, [restaurant.id, setFlash]);

  const loadMenuItems = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
      setMenuItems((data.items || []).map((item) => ({ id: item.id, name: item.name, price: item.price, status: item.active !== false ? 'Available' : 'Archived' })));
    } catch {}
  }, [restaurant.id]);

  useEffect(() => {
    loadOrders();
    loadMenuItems();

    const url = `/api/restaurants/${restaurant.id}/orders/sse`;
    const es = new EventSource(url, { withCredentials: true });

    const sseTimeout = setTimeout(() => {
      if (!fallbackRef.current) {
        fallbackRef.current = setInterval(loadOrders, 7000);
      }
    }, 12000);

    es.addEventListener("orders", (event) => {
      try {
        const data = JSON.parse(event.data);
        const mapped = (data.orders || []).map(transformApiOrderToView);
        setOrders(mapped);
        setLastOrderIds((prev) => {
          const currentIds = new Set(data.orders.map((o) => o.id));
          if (prev.size > 0 && currentIds.size > prev.size) playNotificationSound();
          return currentIds;
        });
      } catch {}
      clearTimeout(sseTimeout);
      if (fallbackRef.current) { clearInterval(fallbackRef.current); fallbackRef.current = null; }
    });

    es.addEventListener("error", () => {
      clearTimeout(sseTimeout);
      if (!fallbackRef.current) fallbackRef.current = setInterval(loadOrders, 7000);
    });

    return () => { es.close(); clearTimeout(sseTimeout); if (fallbackRef.current) clearInterval(fallbackRef.current); };
  }, [restaurant.id, loadOrders, loadMenuItems]);

  useEffect(() => { setAcceptingOrders(restaurant.active); }, [restaurant.active]);

  async function handleAcceptOrder(orderId) {
    const rawId = orderId.replace('#', '');
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${rawId}/status`, { method: "PATCH", body: { status: "confirmed" } });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleCancelOrder(orderId) {
    if (!confirm(`Cancel order ${orderId}?`)) return;
    const rawId = orderId.replace('#', '');
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${rawId}/status`, { method: "PATCH", body: { status: "cancelled" } });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleMarkServed(orderId) {
    const rawId = orderId.replace('#', '');
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/orders/${rawId}/status`, { method: "PATCH", body: { status: "completed" } });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleAddManualOrder(newOrder) {
    clearFlash();
    try {
      const payload = {
        tableNumber: parseInt(newOrder.table.replace('Table ', '')),
        items: newOrder.items.map((it) => ({ menuItemName: it.name, quantity: it.quantity, notes: it.customization })),
        totalAmount: newOrder.price,
      };
      await apiRequest(`/restaurants/${restaurant.id}/orders`, { method: "POST", body: payload });
      setFlash({ type: "success", message: "Manual order placed." });
      await Promise.all([loadOrders(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function toggleAcceptingOrders() {
    const newValue = !acceptingOrders;
    try {
      const formData = new FormData();
      formData.set("active", String(newValue));
      await apiRequest(`/restaurants/${restaurant.id}`, { method: "PATCH", formData });
      setAcceptingOrders(newValue);
      await refreshWorkspace();
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">Orders</h1>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            onClick={toggleAcceptingOrders}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${acceptingOrders ? "border-success/40 bg-success text-white" : "border-border bg-muted"}`}
            role="switch" aria-checked={acceptingOrders} aria-label="Accepting orders"
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${acceptingOrders ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </section>

      <OrdersView
        orders={orders}
        setOrders={setOrders}
        menuItems={menuItems}
        onAddManualOrder={handleAddManualOrder}
        onAcceptOrder={handleAcceptOrder}
        onCancelOrder={handleCancelOrder}
        onMarkServed={handleMarkServed}
      />
    </>
  );
}
