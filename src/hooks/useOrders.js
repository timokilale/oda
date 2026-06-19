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

const cache = new Map();

export default function useOrders() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [orders, setOrders] = useState(() => cache.get(restaurant.id) || []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderService.getOrders(restaurant.id);
      const raw = data.orders || [];
      const mapped = raw.map(transformApiOrderToView);
      cache.set(restaurant.id, mapped);
      setOrders(mapped);
    } catch (error) {
      if (!error.message.includes("timed out")) {
        setFlash({ type: "error", message: error.message });
      }
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    const wasCached = cache.has(restaurant.id);

    if (!wasCached) {
      loadOrders();
    }

    const unsubscribe = subscribeToOrders(restaurant.id, (rawOrders) => {
      const mapped = rawOrders.map(transformApiOrderToView);
      if (!wasCached) {
        return;
      }
      cache.set(restaurant.id, mapped);
      setOrders((prev) => {
        if (mapped.length > prev.length) {
          playNotificationSound();
        }
        return mapped;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [restaurant.id, loadOrders]);

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

  return {
    orders,
    acceptOrder,
    cancelOrder,
    markServed,
  };
}
