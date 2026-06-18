import { subscribe } from "./eventBus.js";

export function subscribeToOrders(restaurantId, onOrderCreated, onOrderUpdated) {
  const unsub1 = subscribe("order.created", (data) => {
    if (String(data.restaurantId) === String(restaurantId)) {
      onOrderCreated(data.order);
    }
  });

  const unsub2 = subscribe("order.updated", (data) => {
    if (String(data.restaurantId) === String(restaurantId)) {
      onOrderUpdated(data.order);
    }
  });

  return () => {
    unsub1();
    unsub2();
  };
}
