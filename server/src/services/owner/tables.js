import { query } from "../../db.js";
import { getOwnedRestaurant } from "../ownerAccess.js";
import {
  createTableQrCode,
  deleteUploadedAsset,
  HttpError,
  normalizeTableNumber,
} from "../../utils.js";

export async function listOwnedRestaurantTables(ownerId, restaurantId) {
  const restaurant = await getOwnedRestaurant(ownerId, restaurantId);

  const tableRows = await query(
    `
      SELECT id, table_number, qr_code_path, qr_target_url, created_at
      FROM restaurant_tables
      WHERE restaurant_id = ?
      ORDER BY table_number
    `,
    [restaurantId],
  );

  return {
    tables: tableRows.map((row) => ({
      id: row.id,
      tableNumber: row.table_number,
      qrCodeUrl: row.qr_code_path,
      qrTargetUrl: row.qr_target_url,
      createdAt: row.created_at,
      legacyToken: `${restaurant.id}-${row.table_number}`,
    })),
  };
}

export async function createOwnedRestaurantTable(ownerId, restaurantId, payload) {
  const restaurant = await getOwnedRestaurant(ownerId, restaurantId);

  const tableNumber = normalizeTableNumber(payload.tableNumber);
  if (!tableNumber) {
    throw new HttpError(400, "Table number is required.");
  }

  const existingRows = await query(
    `
      SELECT id
      FROM restaurant_tables
      WHERE restaurant_id = ? AND table_number = ?
      LIMIT 1
    `,
    [restaurantId, tableNumber],
  );

  if (existingRows.length) {
    throw new HttpError(409, "Table already exists. Use a different table number.");
  }

  const qr = await createTableQrCode(restaurant.id, restaurant.publicSlug, tableNumber);
  const result = await query(
    `
      INSERT INTO restaurant_tables (restaurant_id, table_number, qr_code_path, qr_target_url)
      VALUES (?, ?, ?, ?)
    `,
    [restaurantId, tableNumber, qr.qrCodePath, qr.qrTargetUrl],
  );

  return {
    table: {
      id: result.insertId,
      tableNumber,
      qrCodeUrl: qr.qrCodePath,
      qrTargetUrl: qr.qrTargetUrl,
      legacyToken: `${restaurant.id}-${tableNumber}`,
    },
  };
}

export async function deleteOwnedRestaurantTable(ownerId, restaurantId, tableId) {
  await getOwnedRestaurant(ownerId, restaurantId);

  const tableRows = await query(
    `
      SELECT id, qr_code_path
      FROM restaurant_tables
      WHERE id = ? AND restaurant_id = ?
      LIMIT 1
    `,
    [tableId, restaurantId],
  );

  if (!tableRows.length) {
    throw new HttpError(404, "Table not found.");
  }

  await query("DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?", [tableId, restaurantId]);
  await deleteUploadedAsset(tableRows[0].qr_code_path);

  return null;
}
