import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret";
process.env.EXPOSE_DEV_OTP = "true";
process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || "http://localhost:5173";
process.env.MYSQL_DATABASE = process.env.MYSQL_DATABASE || "oda_cloud_test";
process.env.OTP_MAX_REQUESTS_PER_WINDOW = "3";
process.env.OTP_MAX_REQUESTS_PER_IP_WINDOW = "10";
process.env.OTP_REQUEST_WINDOW_MINUTES = "15";

const { app } = await import("../src/index.js");
const { getPool, closePool, query } = await import("../src/db.js");
const { ensureSchema } = await import("../src/schema.js");
const { ensureStorageDirs } = await import("../src/utils.js");

let server;
let baseUrl = "";

async function startTestServer() {
  return new Promise((resolve, reject) => {
    let activeServer;
    activeServer = app.listen(0, "127.0.0.1", () => resolve(activeServer));
    activeServer.on("error", reject);
  });
}

async function stopTestServer() {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function resetDatabase() {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const tableName of [
      "order_items",
      "orders",
      "restaurant_tables",
      "menu_items",
      "owner_restaurants",
      "restaurants",
      "owner_auth_tokens",
      "owner_auth_otps",
      "pending_owner_registrations",
      "owners",
    ]) {
      await connection.query(`TRUNCATE TABLE \`${tableName}\``);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    connection.release();
  }
}

function extractCookieHeader(response) {
  const cookieHeaders = response.headers.getSetCookie?.() || [];
  return cookieHeaders.map((value) => value.split(";", 1)[0]).join("; ");
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

async function apiFetch(path, { method = "GET", body, formData, cookie } = {}) {
  const headers = {};
  const options = {
    method,
    headers,
  };

  if (cookie) {
    headers.cookie = cookie;
  }

  if (formData) {
    options.body = formData;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await readJson(response);

  return { response, payload };
}

async function registerOwner({
  phoneNumber = "+254700000000",
  restaurantName = "Regression Kitchen",
  city = "Nairobi",
  country = "Kenya",
} = {}) {
  const formData = new FormData();
  formData.set("phoneNumber", phoneNumber);
  formData.set("restaurantName", restaurantName);
  formData.set("city", city);
  formData.set("country", country);
  formData.set("restaurantImagePositionX", "50");
  formData.set("restaurantImagePositionY", "50");

  const otpRequest = await apiFetch("/api/auth/register/request-otp", {
    method: "POST",
    formData,
  });

  assert.equal(otpRequest.response.status, 202);
  assert.match(String(otpRequest.payload?.devOtpCode || ""), /^\d{6}$/);

  const verifyResponse = await apiFetch("/api/auth/register/verify-otp", {
    method: "POST",
    body: {
      phoneNumber,
      otpCode: otpRequest.payload.devOtpCode,
    },
  });

  assert.equal(verifyResponse.response.status, 200);

  const cookie = extractCookieHeader(verifyResponse.response);
  assert.ok(cookie.includes("oda_owner_token="));

  const restaurantsResponse = await apiFetch("/api/restaurants", { cookie });
  assert.equal(restaurantsResponse.response.status, 200);
  assert.equal(restaurantsResponse.payload.restaurants.length, 1);

  return {
    cookie,
    owner: verifyResponse.payload.owner,
    restaurant: restaurantsResponse.payload.restaurants[0],
  };
}

async function createMenuItemViaApi(restaurantId, cookie, overrides = {}) {
  const formData = new FormData();
  formData.set("name", overrides.name || "Pilau");
  formData.set("price", overrides.price || "1200.00");
  formData.set("category", overrides.category || "Main dishes");
  formData.set("description", overrides.description || "Signature rice.");
  formData.set("imagePositionX", overrides.imagePositionX || "50");
  formData.set("imagePositionY", overrides.imagePositionY || "50");

  if (overrides.image) {
    formData.set("image", overrides.image);
  }

  return apiFetch(`/api/restaurants/${restaurantId}/menu-items`, {
    method: "POST",
    formData,
    cookie,
  });
}

before(async () => {
  await ensureStorageDirs();
  await ensureSchema();
  server = await startTestServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
  await ensureSchema();
  await resetDatabase();
});

after(async () => {
  await stopTestServer();
  await closePool();
});

test("admin endpoints reject unauthenticated access", async () => {
  const { response, payload } = await apiFetch("/api/admin/restaurants");

  assert.equal(response.status, 401);
  assert.equal(payload?.error, "Authentication required.");
});

test("admin endpoints allow authenticated admins", async () => {
  const { cookie, owner } = await registerOwner({
    phoneNumber: "+254700000001",
    restaurantName: "Admin Kitchen",
  });

  await query("UPDATE owners SET is_admin = 1 WHERE id = ?", [owner.id]);

  const { response, payload } = await apiFetch("/api/admin/restaurants", { cookie });

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].name, "Admin Kitchen");
});

test("OTP requests are rate-limited per phone number", async () => {
  function buildOtpFormData() {
    const formData = new FormData();
    formData.set("phoneNumber", "+254700000002");
    formData.set("restaurantName", "Throttle Grill");
    formData.set("city", "Nairobi");
    formData.set("country", "Kenya");
    formData.set("restaurantImagePositionX", "50");
    formData.set("restaurantImagePositionY", "50");
    return formData;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { response } = await apiFetch("/api/auth/register/request-otp", {
      method: "POST",
      formData: buildOtpFormData(),
    });
    assert.equal(response.status, 202);
  }

  const throttled = await apiFetch("/api/auth/register/request-otp", {
    method: "POST",
    formData: buildOtpFormData(),
  });

  assert.equal(throttled.response.status, 429);
  assert.equal(
    throttled.payload?.error,
    "Too many OTP requests for this phone number. Try again later.",
  );
});

test("menu deletion archives historical items instead of crashing", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000003",
    restaurantName: "Archive Bistro",
  });

  const itemInsert = await query(
    `
      INSERT INTO menu_items (restaurant_id, name, description, price, category, active)
      VALUES (?, 'Legacy Stew', 'Sold before', 850.00, 'Main dishes', 1)
    `,
    [restaurant.id],
  );
  const itemId = itemInsert.insertId;

  const orderInsert = await query(
    `
      INSERT INTO orders (restaurant_id, table_number, status)
      VALUES (?, 'A1', 'pending')
    `,
    [restaurant.id],
  );

  await query(
    `
      INSERT INTO order_items (order_id, menu_item_id, quantity)
      VALUES (?, ?, 2)
    `,
    [orderInsert.insertId, itemId],
  );

  const deleteResponse = await apiFetch(
    `/api/restaurants/${restaurant.id}/menu-items/${itemId}`,
    {
      method: "DELETE",
      cookie,
    },
  );

  assert.equal(deleteResponse.response.status, 204);

  const archivedRows = await query(
    "SELECT active FROM menu_items WHERE id = ? AND restaurant_id = ?",
    [itemId, restaurant.id],
  );
  assert.equal(archivedRows.length, 1);
  assert.equal(Number(archivedRows[0].active), 0);

  const menuResponse = await apiFetch(`/api/restaurants/${restaurant.id}/menu-items`, { cookie });
  assert.equal(menuResponse.response.status, 200);
  assert.equal(menuResponse.payload.items.length, 1);
  assert.equal(menuResponse.payload.items[0].id, itemId);
  assert.equal(menuResponse.payload.items[0].active, false);
});

test("restaurant settings patch updates the owner workspace", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000007",
    restaurantName: "Settings Lab",
  });

  const formData = new FormData();
  formData.set("restaurantName", "Settings Lab Prime");
  formData.set("address", "Moi Avenue");
  formData.set("city", "Mombasa");
  formData.set("country", "Kenya");
  formData.set("phone", "+254711111111");
  formData.set("active", "false");
  formData.set("removeImage", "false");
  formData.set("restaurantImagePositionX", "50");
  formData.set("restaurantImagePositionY", "50");

  const { response, payload } = await apiFetch(`/api/restaurants/${restaurant.id}`, {
    method: "PATCH",
    formData,
    cookie,
  });

  assert.equal(response.status, 200);
  assert.equal(payload?.restaurant.name, "Settings Lab Prime");
  assert.equal(payload?.restaurant.address, "Moi Avenue");
  assert.equal(payload?.restaurant.city, "Mombasa");
  assert.equal(payload?.restaurant.active, false);
  assert.equal(payload?.restaurant.phone, "+254711111111");
});

test("menu item patch updates owner-visible catalog state", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000008",
    restaurantName: "Edit Kitchen",
  });

  const createResponse = await createMenuItemViaApi(restaurant.id, cookie, {
    name: "Pilau",
    price: "1200.00",
  });
  assert.equal(createResponse.response.status, 201);
  const itemId = createResponse.payload.item.id;

  const formData = new FormData();
  formData.set("name", "Pilau Deluxe");
  formData.set("price", "1450.00");
  formData.set("category", "Main dishes");
  formData.set("description", "Updated signature rice.");
  formData.set("active", "false");
  formData.set("removeImage", "false");
  formData.set("imagePositionX", "50");
  formData.set("imagePositionY", "50");

  const patchResponse = await apiFetch(`/api/restaurants/${restaurant.id}/menu-items/${itemId}`, {
    method: "PATCH",
    formData,
    cookie,
  });

  assert.equal(patchResponse.response.status, 200);
  assert.equal(patchResponse.payload?.item.name, "Pilau Deluxe");
  assert.equal(patchResponse.payload?.item.active, false);

  const menuResponse = await apiFetch(`/api/restaurants/${restaurant.id}/menu-items`, { cookie });
  assert.equal(menuResponse.response.status, 200);
  assert.equal(menuResponse.payload.items.length, 1);
  assert.equal(menuResponse.payload.items[0].name, "Pilau Deluxe");
  assert.equal(menuResponse.payload.items[0].active, false);
});

test("order status transitions reject invalid jumps", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000004",
    restaurantName: "Status Works",
  });

  const orderInsert = await query(
    `
      INSERT INTO orders (restaurant_id, table_number, status)
      VALUES (?, 'B2', 'pending')
    `,
    [restaurant.id],
  );

  const invalidJump = await apiFetch(
    `/api/restaurants/${restaurant.id}/orders/${orderInsert.insertId}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "completed" },
    },
  );

  assert.equal(invalidJump.response.status, 409);
  assert.match(invalidJump.payload?.error || "", /pending to completed/i);

  const confirmResponse = await apiFetch(
    `/api/restaurants/${restaurant.id}/orders/${orderInsert.insertId}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "confirmed" },
    },
  );
  assert.equal(confirmResponse.response.status, 200);
  assert.equal(confirmResponse.payload.status, "confirmed");

  const rollbackResponse = await apiFetch(
    `/api/restaurants/${restaurant.id}/orders/${orderInsert.insertId}/status`,
    {
      method: "PATCH",
      cookie,
      body: { status: "pending" },
    },
  );
  assert.equal(rollbackResponse.response.status, 409);
  assert.match(rollbackResponse.payload?.error || "", /confirmed to pending/i);
});

test("menu creation rejects malformed prices", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000005",
    restaurantName: "Validation House",
  });

  const { response, payload } = await createMenuItemViaApi(restaurant.id, cookie, {
    price: "-4.999",
  });

  assert.equal(response.status, 400);
  assert.equal(payload?.error, "Price must be a valid amount with up to 2 decimal places.");
});

test("menu creation rejects fake image payloads", async () => {
  const { cookie, restaurant } = await registerOwner({
    phoneNumber: "+254700000006",
    restaurantName: "Upload Police",
  });

  const fakeImage = new File(["definitely not a real image"], "bad.png", {
    type: "image/png",
  });

  const { response, payload } = await createMenuItemViaApi(restaurant.id, cookie, {
    image: fakeImage,
  });

  assert.equal(response.status, 400);
  assert.equal(
    payload?.error,
    "Uploaded file content does not match a supported image format.",
  );
});
