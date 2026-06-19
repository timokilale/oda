import { subscribe } from "./eventBus.js";

export function subscribeToOrders(restaurantId, onOrdersUpdate) {
  const sseUrl = `/api/restaurants/${restaurantId}/orders/sse`;

  const unsub = subscribe("orders", (data) => {
    onOrdersUpdate(data.orders || [], data.orderSummary || {});
  }, sseUrl);

  return unsub;
}
