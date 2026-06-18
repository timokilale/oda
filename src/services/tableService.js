import { apiRequest } from "../lib/api.js";

export function getTables(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/tables`);
}

export function createTable(restaurantId, data) {
  return apiRequest(`/restaurants/${restaurantId}/tables`, {
    method: "POST",
    body: data,
  });
}

export function deleteTable(restaurantId, tableNumber) {
  return apiRequest(`/restaurants/${restaurantId}/tables/${tableNumber}`, {
    method: "DELETE",
  });
}
