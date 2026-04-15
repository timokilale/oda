import express from "express";
import { query } from "../db.js";
import { asyncHandler } from "../http/asyncHandler.js";
import { requireAdmin } from "../services/ownerAuth.js";

const router = express.Router();

router.use(requireAdmin);

router.get(
  "/restaurants",
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `
        SELECT id, name, public_slug, city, country, active
        FROM restaurants
        ORDER BY id
        LIMIT 100
      `,
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        publicSlug: row.public_slug,
        city: row.city,
        country: row.country,
        active: Boolean(row.active),
      })),
    );
  }),
);

router.get(
  "/restaurants/:restaurantId/menu-template",
  asyncHandler(async (req, res) => {
    const rows = await query(
      `
        SELECT name, price, description, category
        FROM menu_items
        WHERE restaurant_id = ? AND active = 1
        ORDER BY id
      `,
      [req.params.restaurantId],
    );

    res.json(
      rows.map((row) => ({
        name: row.name,
        price: Number(row.price),
        description: row.description,
        category: row.category,
      })),
    );
  }),
);

export default router;
