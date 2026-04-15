import express from "express";
import { getPool, withTransaction } from "../db.js";
import { asyncHandler } from "../http/asyncHandler.js";
import {
  getMenuItemsForRestaurant,
  getRestaurantRecordByPublicRef,
} from "../repository.js";
import { buildMenuTree, HttpError, resolveTableNumber } from "../utils.js";

const router = express.Router();

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

    const normalizedItems = submittedItems
      .map((item) => ({
        id: Number(item.id),
        quantity: Number(item.quantity),
      }))
      .filter((item) => Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0);

    if (!normalizedItems.length) {
      throw new HttpError(400, "No items selected.");
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
