import { apiRequest } from "../lib/api.js";

export function getMenuItems(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items`);
}

export function createMenuItem(restaurantId, data) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items`, {
    method: "POST",
    body: data,
  });
}

export function updateMenuItem(restaurantId, itemId, data) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items/${itemId}`, {
    method: "PATCH",
    body: data,
  });
}

export function deleteMenuItem(restaurantId, itemId) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items/${itemId}`, {
    method: "DELETE",
  });
}
