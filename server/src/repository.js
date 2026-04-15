import { getPool, query } from "./db.js";
import {
  buildRestaurantId,
  buildUniqueRestaurantSlug,
  formatMenuItem,
  formatOrder,
  formatRestaurant,
  HttpError,
} from "./utils.js";

export function sanitizeOwner(row) {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    phoneVerifiedAt: row.phone_verified_at,
    isAdmin: Boolean(row.is_admin),
    canManageMultipleRestaurants: Boolean(row.can_manage_multiple_restaurants),
  };
}

export async function getOwnerById(ownerId, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
    `
      SELECT id, phone_number, phone_verified_at, is_admin, can_manage_multiple_restaurants
      FROM owners
      WHERE id = ?
      LIMIT 1
    `,
    [ownerId],
  );

  return rows[0] || null;
}

export async function getOwnerByPhoneNumber(phoneNumber, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
    `
      SELECT id, phone_number, phone_verified_at, is_admin, can_manage_multiple_restaurants
      FROM owners
      WHERE phone_number = ?
      LIMIT 1
    `,
    [phoneNumber],
  );

  return rows[0] || null;
}

export async function getRestaurantRecord(restaurantId, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
    `
      SELECT
        id,
        name,
        public_slug,
        address,
        city,
        country,
        phone,
        active,
        image_path,
        image_position_x,
        image_position_y
      FROM restaurants
      WHERE id = ?
      LIMIT 1
    `,
    [restaurantId],
  );

  return rows[0] ? formatRestaurant(rows[0]) : null;
}

export async function getRestaurantRecordByPublicRef(restaurantRef, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
    `
      SELECT
        id,
        name,
        public_slug,
        address,
        city,
        country,
        phone,
        active,
        image_path,
        image_position_x,
        image_position_y
      FROM restaurants
      WHERE public_slug = ? OR id = ?
      LIMIT 1
    `,
    [restaurantRef, restaurantRef],
  );

  return rows[0] ? formatRestaurant(rows[0]) : null;
}

export async function getMenuItemsForRestaurant(restaurantId, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
    `
      SELECT
        id,
        restaurant_id,
        name,
        description,
        price,
        category,
        image_path,
        image_position_x,
        image_position_y
      FROM menu_items
      WHERE restaurant_id = ? AND active = 1
      ORDER BY id
    `,
    [restaurantId],
  );

  return rows.map(formatMenuItem);
}

export async function getAllMenuItemsForRestaurant(restaurantId, executor = null) {
  const db = executor ?? (await getPool());
  const [rows] = await db.execute(
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
      WHERE restaurant_id = ?
      ORDER BY active DESC, category, name, id DESC
    `,
    [restaurantId],
  );

  return rows.map(formatMenuItem);
}

export async function getOwnerRestaurants(ownerId) {
  const rows = await query(
    `
      SELECT
        r.id,
        r.name,
        r.public_slug,
        r.address,
        r.city,
        r.country,
        r.phone,
        r.active,
        r.image_path,
        r.image_position_x,
        r.image_position_y,
        COALESCE(menu_counts.menu_item_count, 0) AS menu_item_count,
        COALESCE(table_counts.table_count, 0) AS table_count,
        COALESCE(order_counts.order_count, 0) AS order_count,
        COALESCE(order_counts.open_order_count, 0) AS open_order_count
      FROM restaurants r
      JOIN owner_restaurants orl ON orl.restaurant_id = r.id
      LEFT JOIN (
        SELECT restaurant_id, COUNT(*) AS menu_item_count
        FROM menu_items
        WHERE active = 1
        GROUP BY restaurant_id
      ) menu_counts ON menu_counts.restaurant_id = r.id
      LEFT JOIN (
        SELECT restaurant_id, COUNT(*) AS table_count
        FROM restaurant_tables
        GROUP BY restaurant_id
      ) table_counts ON table_counts.restaurant_id = r.id
      LEFT JOIN (
        SELECT
          restaurant_id,
          COUNT(*) AS order_count,
          SUM(CASE WHEN status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) AS open_order_count
        FROM orders
        GROUP BY restaurant_id
      ) order_counts ON order_counts.restaurant_id = r.id
      WHERE orl.owner_id = ?
      ORDER BY r.name, r.id
    `,
    [ownerId],
  );

  return rows.map((row) => ({
    ...formatRestaurant(row),
    menuItemCount: Number(row.menu_item_count || 0),
    tableCount: Number(row.table_count || 0),
    orderCount: Number(row.order_count || 0),
    openOrderCount: Number(row.open_order_count || 0),
  }));
}

export function canOwnerAddRestaurant(owner, ownedRestaurantCount) {
  return (
    ownedRestaurantCount === 0 ||
    Boolean(owner.canManageMultipleRestaurants) ||
    Boolean(owner.isAdmin)
  );
}

export async function ensureOwnerRestaurantAccess(ownerId, restaurantId) {
  const rows = await query(
    `
      SELECT 1
      FROM owner_restaurants
      WHERE owner_id = ? AND restaurant_id = ?
      LIMIT 1
    `,
    [ownerId, restaurantId],
  );

  if (!rows.length) {
    throw new HttpError(403, "You do not have access to this restaurant.");
  }
}

export async function getWorkspaceSummary(restaurantId) {
  const [menuCountRows, tableCountRows, totalOrderRows, openOrderRows] = await Promise.all([
    query("SELECT COUNT(*) AS total FROM menu_items WHERE restaurant_id = ? AND active = 1", [restaurantId]),
    query("SELECT COUNT(*) AS total FROM restaurant_tables WHERE restaurant_id = ?", [restaurantId]),
    query("SELECT COUNT(*) AS total FROM orders WHERE restaurant_id = ?", [restaurantId]),
    query(
      "SELECT COUNT(*) AS total FROM orders WHERE restaurant_id = ? AND status IN ('pending', 'confirmed')",
      [restaurantId],
    ),
  ]);

  return {
    menuItemCount: Number(menuCountRows[0]?.total || 0),
    tableCount: Number(tableCountRows[0]?.total || 0),
    totalOrderCount: Number(totalOrderRows[0]?.total || 0),
    openOrderCount: Number(openOrderRows[0]?.total || 0),
  };
}

export async function getRestaurantReports(restaurantId) {
  const totalsRows = await query(
    `
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
        SUM(CASE WHEN status <> 'cancelled' THEN order_totals.total_amount ELSE 0 END) AS revenue_total,
        AVG(CASE WHEN status <> 'cancelled' THEN order_totals.total_amount END) AS average_ticket,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS orders_today
      FROM orders
      LEFT JOIN (
        SELECT oi.order_id, SUM(oi.quantity * mi.price) AS total_amount
        FROM order_items oi
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        GROUP BY oi.order_id
      ) order_totals ON order_totals.order_id = orders.id
      WHERE restaurant_id = ?
    `,
    [restaurantId],
  );

  const topItemsRows = await query(
    `
      SELECT
        mi.name,
        SUM(oi.quantity) AS quantity_sold,
        SUM(oi.quantity * mi.price) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.restaurant_id = ? AND o.status <> 'cancelled'
      GROUP BY mi.id, mi.name
      ORDER BY quantity_sold DESC, revenue DESC, mi.name
      LIMIT 5
    `,
    [restaurantId],
  );

  const totals = totalsRows[0] || {};
  const completedOrders = Number(totals.completed_orders || 0);
  const activeOrders =
    Number(totals.pending_orders || 0) +
    Number(totals.confirmed_orders || 0) +
    completedOrders;

  return {
    totalOrders: Number(totals.total_orders || 0),
    pendingOrders: Number(totals.pending_orders || 0),
    confirmedOrders: Number(totals.confirmed_orders || 0),
    completedOrders,
    cancelledOrders: Number(totals.cancelled_orders || 0),
    revenueTotal: Number(totals.revenue_total || 0),
    averageTicket: Number(totals.average_ticket || 0),
    ordersToday: Number(totals.orders_today || 0),
    completionRate: activeOrders ? (completedOrders / activeOrders) * 100 : 0,
    topItems: topItemsRows.map((row) => ({
      name: row.name,
      quantitySold: Number(row.quantity_sold || 0),
      revenue: Number(row.revenue || 0),
    })),
  };
}

export async function createRestaurantForOwner(
  executor,
  ownerId,
  restaurantName,
  city,
  country,
  imagePath = null,
  imagePositionX = 50,
  imagePositionY = 50,
) {
  const restaurantId = await buildRestaurantId(executor, ownerId);
  const publicSlug = await buildUniqueRestaurantSlug(executor, restaurantName);

  await executor.execute(
    `
      INSERT INTO restaurants (
        id,
        name,
        public_slug,
        city,
        country,
        active,
        image_path,
        image_position_x,
        image_position_y
      )
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `,
    [
      restaurantId,
      restaurantName,
      publicSlug,
      city || null,
      country || null,
      imagePath,
      imagePositionX,
      imagePositionY,
    ],
  );

  await executor.execute(
    "INSERT INTO owner_restaurants (owner_id, restaurant_id) VALUES (?, ?)",
    [ownerId, restaurantId],
  );

  return restaurantId;
}

export async function updateRestaurantRecord(
  restaurantId,
  {
    name,
    address,
    city,
    country,
    phone,
    active,
    imagePath,
    imagePositionX,
    imagePositionY,
  },
) {
  await query(
    `
      UPDATE restaurants
      SET
        name = ?,
        address = ?,
        city = ?,
        country = ?,
        phone = ?,
        active = ?,
        image_path = ?,
        image_position_x = ?,
        image_position_y = ?
      WHERE id = ?
    `,
    [
      name,
      address,
      city,
      country,
      phone,
      active ? 1 : 0,
      imagePath,
      imagePositionX,
      imagePositionY,
      restaurantId,
    ],
  );
}

export async function getOrdersForRestaurant(restaurantId) {
  const rows = await query(
    `
      SELECT
        o.id,
        o.table_number,
        o.status,
        o.created_at,
        COALESCE(SUM(oi.quantity * mi.price), 0) AS total_amount,
        GROUP_CONCAT(
          CONCAT(oi.quantity, 'x ', mi.name)
          ORDER BY mi.name
          SEPARATOR ', '
        ) AS items_summary
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
      WHERE o.restaurant_id = ?
      GROUP BY o.id, o.table_number, o.status, o.created_at
      ORDER BY o.id DESC
    `,
    [restaurantId],
  );

  const orders = rows.map(formatOrder);

  return {
    orders,
    summary: {
      totalOrderCount: orders.length,
      pendingOrderCount: orders.filter((order) => order.status === "pending").length,
      confirmedOrderCount: orders.filter((order) => order.status === "confirmed").length,
      completedOrderCount: orders.filter((order) => order.status === "completed").length,
      cancelledOrderCount: orders.filter((order) => order.status === "cancelled").length,
    },
  };
}
