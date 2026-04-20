import express from "express";
import { getPool, withTransaction } from "../db.js";
import { asyncHandler } from "../http/asyncHandler.js";
import {
  getMenuItemsForRestaurant,
  getRestaurantRecordByPublicRef,
} from "../repository.js";
import { buildMenuTree, HttpError, normalizeRequestIp, resolveTableNumber } from "../utils.js";

const router = express.Router();

/* ── Rate limiter for order submissions ── */
const ORDER_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ORDER_RATE_MAX = 10; // max orders per IP per window
const orderRateMap = new Map();

const MAX_ITEM_QUANTITY = 20;

function checkOrderRateLimit(req) {
  const ip = normalizeRequestIp(req.ip || req.connection?.remoteAddress) || "unknown";
  const now = Date.now();

  let entry = orderRateMap.get(ip);
  if (!entry || now - entry.windowStart > ORDER_RATE_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    orderRateMap.set(ip, entry);
  }

  entry.count += 1;

  if (entry.count > ORDER_RATE_MAX) {
    throw new HttpError(429, "Too many orders. Please wait before trying again.");
  }
}

// Clean up stale rate-limit entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - ORDER_RATE_WINDOW_MS;
  for (const [ip, entry] of orderRateMap) {
    if (entry.windowStart < cutoff) {
      orderRateMap.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref?.();

function assertRestaurantActive(restaurant) {
  if (!restaurant.active) {
    throw new HttpError(403, "This restaurant is not currently accepting orders.");
  }
}

router.get(
  "/restaurants/:restaurantRef/order-context",
  asyncHandler(async (req, res) => {
    const { restaurantRef } = req.params;
    const tableReference = String(req.query.table || "").trim();

    if (!tableReference) {
      throw new HttpError(400, "Table is required.");
    }

    const pool = await getPool();
    const restaurant = await getRestaurantRecordByPublicRef(restaurantRef, pool);
    if (!restaurant) {
      throw new HttpError(404, "Restaurant not found.");
    }

    assertRestaurantActive(restaurant);

    const tableNumber = await resolveTableNumber(pool, restaurant.id, tableReference);
    if (!tableNumber) {
      throw new HttpError(404, "Table not found.");
    }

    const menuItems = await getMenuItemsForRestaurant(restaurant.id, pool);

    res.json({
      restaurant,
      tableNumber,
      menuItems,
      menuTree: buildMenuTree(menuItems),
    });
  }),
);

router.post(
  "/restaurants/:restaurantRef/orders",
  asyncHandler(async (req, res) => {
    checkOrderRateLimit(req);

    const { restaurantRef } = req.params;
    const tableReference = String(req.body.tableNumber || "").trim();
    const submittedItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!tableReference) {
      throw new HttpError(400, "Missing table number.");
    }

    const restaurant = await getRestaurantRecordByPublicRef(restaurantRef);
    if (!restaurant) {
      throw new HttpError(404, "Restaurant not found.");
    }

    assertRestaurantActive(restaurant);

    const normalizedItems = submittedItems
      .map((item) => ({
        id: Number(item.id),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0);

    if (!normalizedItems.length) {
      throw new HttpError(400, "No items selected.");
    }

    for (const item of normalizedItems) {
      if (item.quantity > MAX_ITEM_QUANTITY) {
        throw new HttpError(400, `Maximum quantity per item is ${MAX_ITEM_QUANTITY}.`);
      }
    }

    const order = await withTransaction(async (connection) => {
      const resolvedTable = await resolveTableNumber(connection, restaurant.id, tableReference);
      if (!resolvedTable) {
        throw new HttpError(404, "Unknown table QR code.");
      }

      const placeholders = normalizedItems.map(() => "?").join(", ");
      const [menuRows] = await connection.execute(
        `
          SELECT id
          FROM menu_items
          WHERE restaurant_id = ? AND active = 1 AND id IN (${placeholders})
        `,
        [restaurant.id, ...normalizedItems.map((item) => item.id)],
      );

      if (menuRows.length !== normalizedItems.length) {
        throw new HttpError(400, "One or more selected menu items are invalid.");
      }

      const [orderResult] = await connection.execute(
        `
          INSERT INTO orders (restaurant_id, table_number, status)
          VALUES (?, ?, 'pending')
        `,
        [restaurant.id, resolvedTable],
      );

      for (const item of normalizedItems) {
        await connection.execute(
          `
            INSERT INTO order_items (order_id, menu_item_id, quantity)
            VALUES (?, ?, ?)
          `,
          [orderResult.insertId, item.id, item.quantity],
        );
      }

      return {
        id: orderResult.insertId,
        tableNumber: resolvedTable,
      };
    });

    res.status(201).json({
      orderId: order.id,
      tableNumber: order.tableNumber,
      status: "pending",
      successMessage: "Order placed successfully.",
    });
  }),
);

export default router;
