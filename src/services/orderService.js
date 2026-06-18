import { apiRequest } from "../lib/api.js";

export function getOrders(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/orders`);
}

export function getMenuItems(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items`);
}

export function updateOrderStatus(restaurantId, orderId, status) {
  const rawId = String(orderId).replace("#", "");
  return apiRequest(`/restaurants/${restaurantId}/orders/${rawId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function createOrder(restaurantId, payload) {
  return apiRequest(`/restaurants/${restaurantId}/orders`, {
    method: "POST",
    body: payload,
  });
}
