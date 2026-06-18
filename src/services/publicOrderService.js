import { apiRequest } from '../lib/api';

export function getOrderContext(restaurantRef, tableNumber) {
  return apiRequest(
    `/public/restaurants/${encodeURIComponent(restaurantRef)}/order-context?table=${encodeURIComponent(tableNumber)}`
  );
}

export function getOrders(restaurantRef, tableNumber) {
  return apiRequest(
    `/public/restaurants/${encodeURIComponent(restaurantRef)}/orders?table=${encodeURIComponent(tableNumber)}`
  );
}

export function createOrder(restaurantRef, tableNumber, items) {
  return apiRequest(
    `/public/restaurants/${encodeURIComponent(restaurantRef)}/orders`,
    { method: 'POST', body: { tableNumber, items } }
  );
}
