import express from "express";
import { asyncHandler } from "../../http/asyncHandler.js";
import {
  listOwnedRestaurantOrders,
  updateOwnedRestaurantOrderStatus,
} from "../../services/owner/orders.js";

const router = express.Router();

router.get(
  "/:restaurantId/orders",
  asyncHandler(async (req, res) => {
    res.json(await listOwnedRestaurantOrders(req.owner.id, req.params.restaurantId));
  }),
);

router.patch(
  "/:restaurantId/orders/:orderId/status",
  asyncHandler(async (req, res) => {
    res.json(
      await updateOwnedRestaurantOrderStatus(
        req.owner.id,
        req.params.restaurantId,
        req.params.orderId,
        req.body.status,
      ),
    );
  }),
);

export default router;
