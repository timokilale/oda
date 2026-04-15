import { categorySuggestions } from "../../config.js";
import { query } from "../../db.js";
import { getAllMenuItemsForRestaurant } from "../../repository.js";
import { getOwnedRestaurant } from "../ownerAccess.js";
import {
  deleteUploadedAsset,
  formatMenuItem,
  HttpError,
  normalizeImagePosition,
  parseMoneyAmount,
} from "../../utils.js";

export async function listOwnedRestaurantMenu(ownerId, restaurantId) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const items = await getAllMenuItemsForRestaurant(restaurantId);

  return {
    categorySuggestions,
    items,
  };
}

export async function createOwnedRestaurantMenuItem(ownerId, restaurantId, payload, imagePath) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const name = String(payload.name || "").trim();
  const priceValue = parseMoneyAmount(payload.price, "Price");
  const category = String(payload.category || "").trim();
  const description = String(payload.description || "").trim();
  const imagePositionX = normalizeImagePosition(payload.imagePositionX);
  const imagePositionY = normalizeImagePosition(payload.imagePositionY);

  if (!name || !category) {
    throw new HttpError(400, "Name, price, and category are required.");
  }

  const insertResult = await query(
    `
      INSERT INTO menu_items (
        restaurant_id,
        name,
        description,
        price,
        category,
        image_path,
        image_position_x,
        image_position_y
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      restaurantId,
      name,
      description || null,
      priceValue,
      category,
      imagePath,
      imagePositionX,
      imagePositionY,
    ],
  );

  const itemRows = await query(
    `
      SELECT
        id,
        restaurant_id,
        name,
        description,
        price,
        category,
        active,
        image_path,
        image_position_x,
        image_position_y
      FROM menu_items
      WHERE id = ?
      LIMIT 1
    `,
    [insertResult.insertId],
  );

  return { item: formatMenuItem(itemRows[0]) };
}

function parseActiveValue(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) {
    return fallback;
  }

  if (["true", "1", "yes", "active"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "inactive"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

export async function updateOwnedRestaurantMenuItem(ownerId, restaurantId, itemId, payload, imagePath) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const itemRows = await query(
    `
      SELECT
        id,
        restaurant_id,
        name,
        description,
        price,
        category,
        active,
        image_path,
        image_position_x,
        image_position_y
      FROM menu_items
      WHERE id = ? AND restaurant_id = ?
      LIMIT 1
    `,
    [itemId, restaurantId],
  );

  if (!itemRows.length) {
    throw new HttpError(404, "Menu item not found.");
  }

  const currentItem = formatMenuItem(itemRows[0]);
  const name = String(payload.name ?? currentItem.name ?? "").trim();
  const priceValue = parseMoneyAmount(payload.price ?? currentItem.price, "Price");
  const category = String(payload.category ?? currentItem.category ?? "").trim();
  const description = String(payload.description ?? currentItem.description ?? "").trim();
  const active = parseActiveValue(payload.active, currentItem.active);
  const removeImage = String(payload.removeImage || "").trim().toLowerCase() === "true";
  const nextImagePath = removeImage ? null : imagePath ?? currentItem.imageUrl ?? null;
  const imagePositionX = nextImagePath
    ? normalizeImagePosition(payload.imagePositionX ?? currentItem.imagePositionX)
    : 50;
  const imagePositionY = nextImagePath
    ? normalizeImagePosition(payload.imagePositionY ?? currentItem.imagePositionY)
    : 50;

  if (!name || !category) {
    throw new HttpError(400, "Name, price, and category are required.");
  }

  await query(
    `
      UPDATE menu_items
      SET
        name = ?,
        description = ?,
        price = ?,
        category = ?,
        active = ?,
        image_path = ?,
        image_position_x = ?,
        image_position_y = ?
      WHERE id = ? AND restaurant_id = ?
    `,
    [
      name,
      description || null,
      priceValue,
      category,
      active ? 1 : 0,
      nextImagePath,
      imagePositionX,
      imagePositionY,
      itemId,
      restaurantId,
    ],
  );

  if ((removeImage || imagePath) && currentItem.imageUrl && currentItem.imageUrl !== nextImagePath) {
    await deleteUploadedAsset(currentItem.imageUrl);
  }

  const updatedRows = await query(
    `
      SELECT
        id,
        restaurant_id,
        name,
        description,
        price,
        category,
        active,
        image_path,
        image_position_x,
        image_position_y
      FROM menu_items
      WHERE id = ? AND restaurant_id = ?
      LIMIT 1
    `,
    [itemId, restaurantId],
  );

  return {
    item: formatMenuItem(updatedRows[0]),
  };
}

export async function deleteOwnedRestaurantMenuItem(ownerId, restaurantId, itemId) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const itemRows = await query(
    `
      SELECT id, image_path
      FROM menu_items
      WHERE id = ? AND restaurant_id = ? AND active = 1
      LIMIT 1
    `,
    [itemId, restaurantId],
  );

  if (!itemRows.length) {
    throw new HttpError(404, "Menu item not found.");
  }

  const referenceRows = await query(
    `
      SELECT COUNT(*) AS total
      FROM order_items
      WHERE menu_item_id = ?
    `,
    [itemId],
  );

  if (Number(referenceRows[0]?.total || 0) > 0) {
    await query(
      "UPDATE menu_items SET active = 0 WHERE id = ? AND restaurant_id = ?",
      [itemId, restaurantId],
    );
    return null;
  }

  await query("DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?", [itemId, restaurantId]);
  await deleteUploadedAsset(itemRows[0].image_path);

  return null;
}
