import { apiRequest } from "../lib/api.js";

export function getReports(restaurantId, timeframe) {
  const params = timeframe ? `?timeframe=${timeframe}` : "";
  return apiRequest(`/restaurants/${restaurantId}/reports${params}`);
}

export function getOrders(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/orders`);
}
