import { apiRequest } from "../lib/api.js";

export function getRestaurant(restaurantId, { signal } = {}) {
  return apiRequest(`/restaurants/${restaurantId}`, { signal });
}

export function updateRestaurant(restaurantId, data) {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => formData.set(k, String(v)));
  return apiRequest(`/restaurants/${restaurantId}`, { method: "PATCH", formData });
}
