import express from "express";
import { asyncHandler } from "../../http/asyncHandler.js";
import {
  createOwnedRestaurantTable,
  deleteOwnedRestaurantTable,
  listOwnedRestaurantTables,
} from "../../services/owner/tables.js";

const router = express.Router();

router.get(
  "/:restaurantId/tables",
  asyncHandler(async (req, res) => {
    res.json(await listOwnedRestaurantTables(req.owner.id, req.params.restaurantId));
  }),
);

router.post(
  "/:restaurantId/tables",
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await createOwnedRestaurantTable(req.owner.id, req.params.restaurantId, req.body),
    );
  }),
);

router.delete(
  "/:restaurantId/tables/:tableId",
  asyncHandler(async (req, res) => {
    await deleteOwnedRestaurantTable(
      req.owner.id,
      req.params.restaurantId,
      req.params.tableId,
    );
    res.status(204).end();
  }),
);

export default router;
