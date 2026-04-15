import express from "express";
import { asyncHandler } from "../../http/asyncHandler.js";
import {
  getUploadedFileAsset,
  upload,
  validateUploadedRequestImage,
} from "../../http/uploads.js";
import {
  createOwnedRestaurantMenuItem,
  deleteOwnedRestaurantMenuItem,
  listOwnedRestaurantMenu,
  updateOwnedRestaurantMenuItem,
} from "../../services/owner/menuItems.js";

const router = express.Router();

router.get(
  "/:restaurantId/menu-items",
  asyncHandler(async (req, res) => {
    res.json(await listOwnedRestaurantMenu(req.owner.id, req.params.restaurantId));
  }),
);

router.post(
  "/:restaurantId/menu-items",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    await validateUploadedRequestImage(req.file);

    res.status(201).json(
      await createOwnedRestaurantMenuItem(
        req.owner.id,
        req.params.restaurantId,
        req.body,
        getUploadedFileAsset(req.file),
      ),
    );
  }),
);

router.patch(
  "/:restaurantId/menu-items/:itemId",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    await validateUploadedRequestImage(req.file);

    res.json(
      await updateOwnedRestaurantMenuItem(
        req.owner.id,
        req.params.restaurantId,
        req.params.itemId,
        req.body,
        getUploadedFileAsset(req.file),
      ),
    );
  }),
);

router.delete(
  "/:restaurantId/menu-items/:itemId",
  asyncHandler(async (req, res) => {
    await deleteOwnedRestaurantMenuItem(
      req.owner.id,
      req.params.restaurantId,
      req.params.itemId,
    );
    res.status(204).end();
  }),
);

export default router;
