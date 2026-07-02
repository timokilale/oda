import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiOrderToView } from "../types/managementTypes.js";
import * as orderService from "../services/orderService.js";

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
    if (!cache.has(restaurant.id)) {
      loadOrders();
    }
  }, [loadOrders, restaurant.id]);

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
    refreshOrders: loadOrders,
    acceptOrder,
    cancelOrder,
    markServed,
  };
}
