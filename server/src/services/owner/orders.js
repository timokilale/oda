import { validOwnerOrderStatuses } from "../../config.js";
import { query } from "../../db.js";
import { getOrdersForRestaurant } from "../../repository.js";
import { getOwnedRestaurant } from "../ownerAccess.js";
import { canTransitionOrderStatus, HttpError } from "../../utils.js";

export async function listOwnedRestaurantOrders(ownerId, restaurantId) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const orderData = await getOrdersForRestaurant(restaurantId);

  return {
    orders: orderData.orders,
    orderSummary: orderData.summary,
  };
}

export async function updateOwnedRestaurantOrderStatus(ownerId, restaurantId, orderId, status) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const nextStatus = String(status || "").trim().toLowerCase();

  if (!validOwnerOrderStatuses.includes(nextStatus)) {
    throw new HttpError(400, "Invalid order status.");
  }

  const orderRows = await query(
    "SELECT id, status FROM orders WHERE id = ? AND restaurant_id = ? LIMIT 1",
    [orderId, restaurantId],
  );

  if (!orderRows.length) {
    throw new HttpError(404, "Order not found.");
  }

  const currentStatus = String(orderRows[0].status || "").toLowerCase();
  if (currentStatus === nextStatus) {
    return { status: nextStatus };
  }

  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    throw new HttpError(409, `Cannot change an order from ${currentStatus} to ${nextStatus}.`);
  }

  await query(
    "UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?",
    [nextStatus, orderId, restaurantId],
  );

  return { status: nextStatus };
}
