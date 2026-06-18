import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiOrderToView } from "../types/managementTypes.js";
import * as orderService from "../services/orderService.js";
import { subscribeToOrders } from "../services/realtimeService.js";

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
  } catch {}
}

export default function useOrders() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderService.getOrders(restaurant.id);
      const raw = data.orders || [];
      const mapped = raw.map(transformApiOrderToView);
      setOrders(mapped);
    } catch (error) {
      if (!error.message.includes("timed out")) {
        setFlash({ type: "error", message: error.message });
      }
    }
  }, [restaurant.id, setFlash]);

  const loadMenuItems = useCallback(async () => {
    try {
      const data = await orderService.getMenuItems(restaurant.id);
      setMenuItems(
        (data.items || []).map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          status: item.active !== false ? "Available" : "Archived",
        }))
      );
    } catch {}
  }, [restaurant.id]);

  useEffect(() => {
    const initialLoad = { current: true };
    loadOrders();
    loadMenuItems();

    const onCreated = (raw) => {
      const order = transformApiOrderToView(raw);
      if (initialLoad.current) return;
      playNotificationSound();
      setOrders((prev) => [order, ...prev]);
    };

    const onUpdated = (raw) => {
      const updated = transformApiOrderToView(raw);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    };

    const unsubscribe = subscribeToOrders(restaurant.id, onCreated, onUpdated);

    initialLoad.current = false;

    return () => {
      unsubscribe();
    };
  }, [restaurant.id, loadOrders, loadMenuItems]);

  const acceptOrder = useCallback(
    async (orderId) => {
      const rawId = String(orderId).replace("#", "");
      clearFlash();
      try {
        await orderService.updateOrderStatus(restaurant.id, rawId, "confirmed");
        await Promise.all([loadOrders(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadOrders, refreshWorkspace, setFlash, clearFlash]
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      if (!confirm(`Cancel order ${orderId}?`)) return;
      const rawId = String(orderId).replace("#", "");
      clearFlash();
      try {
        await orderService.updateOrderStatus(restaurant.id, rawId, "cancelled");
        await Promise.all([loadOrders(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadOrders, refreshWorkspace, setFlash, clearFlash]
  );

  const markServed = useCallback(
    async (orderId) => {
      const rawId = String(orderId).replace("#", "");
      clearFlash();
      try {
        await orderService.updateOrderStatus(restaurant.id, rawId, "completed");
        await Promise.all([loadOrders(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadOrders, refreshWorkspace, setFlash, clearFlash]
  );

  const recallOrder = useCallback(
    async (orderId) => {
      const rawId = String(orderId).replace("#", "");
      clearFlash();
      try {
        await orderService.updateOrderStatus(restaurant.id, rawId, "pending");
        setFlash({ type: "success", message: "Order recalled." });
        await Promise.all([loadOrders(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadOrders, refreshWorkspace, setFlash, clearFlash]
  );

  const addManualOrder = useCallback(
    async (newOrder) => {
      clearFlash();
      try {
        const payload = {
          tableNumber:
            newOrder.orderType === "Takeaway"
              ? null
              : parseInt(newOrder.table.replace("Table ", "")),
          orderType: newOrder.orderType,
          items: newOrder.items.map((it) => ({
            menuItemName: it.name,
            menuItemId: it.id,
            quantity: it.quantity,
            notes: it.customization,
          })),
          totalAmount: newOrder.price,
          tip: newOrder.tip || 0,
          serviceCharge: newOrder.serviceCharge || 0,
        };
        await orderService.createOrder(restaurant.id, payload);
        setFlash({ type: "success", message: "Order placed." });
        await Promise.all([loadOrders(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadOrders, refreshWorkspace, setFlash, clearFlash]
  );

  return {
    orders,
    setOrders,
    menuItems,
    acceptOrder,
    cancelOrder,
    markServed,
    recallOrder,
    addManualOrder,
  };
}
