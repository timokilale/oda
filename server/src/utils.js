import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import {
  allowedImageMimeTypes,
  appConfig,
  ownerOrderStatusTransitions,
} from "./config.js";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function ensureStorageDirs() {
  await Promise.all([
    fs.mkdir(appConfig.paths.uploadRoot, { recursive: true }),
    fs.mkdir(appConfig.paths.restaurantUploads, { recursive: true }),
    fs.mkdir(appConfig.paths.menuUploads, { recursive: true }),
    fs.mkdir(appConfig.paths.qrUploads, { recursive: true }),
  ]);
}

export function slugify(value) {
  return (value || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "restaurant";
}

export async function buildUniqueRestaurantSlug(executor, restaurantName, currentRestaurantId = null) {
  const baseSlug = slugify(restaurantName);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const [rows] = await executor.execute(
      "SELECT id FROM restaurants WHERE public_slug = ? LIMIT 1",
      [candidate],
    );

    if (!rows.length || (currentRestaurantId && rows[0].id === currentRestaurantId)) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function buildRestaurantId(executor, ownerId) {
  const baseRestaurantId = `restaurant-${ownerId}`;
  const [rows] = await executor.execute(
    "SELECT id FROM restaurants WHERE id = ? LIMIT 1",
    [baseRestaurantId],
  );

  if (!rows.length) {
    return baseRestaurantId;
  }

  return `${baseRestaurantId}-${crypto.randomUUID().slice(0, 8)}`;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, expectedHash] = storedHash.split(":");
  const incomingHash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, "hex"),
    Buffer.from(incomingHash, "hex"),
  );
}

function safeCompareText(leftValue, rightValue) {
  const leftBuffer = Buffer.from(String(leftValue || ""), "utf8");
  const rightBuffer = Buffer.from(String(rightValue || ""), "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizePhoneNumber(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (digits.length < 10 || digits.length > 15) {
    return "";
  }

  return `+${digits}`;
}

export function isValidPhoneNumber(phoneNumber) {
  return /^\+\d{10,15}$/.test(phoneNumber);
}

export function generateOtpCode(length = appConfig.otpLength) {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join("");
}

export function hashOtpCode(phoneNumber, purpose, otpCode) {
  return crypto
    .createHmac("sha256", appConfig.authSecret)
    .update(`${phoneNumber}:${purpose}:${String(otpCode || "").trim()}`)
    .digest("hex");
}

export function verifyOtpCode(phoneNumber, purpose, otpCode, expectedHash) {
  return safeCompareText(hashOtpCode(phoneNumber, purpose, otpCode), expectedHash);
}

export function generateAuthToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAuthToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

export function readCookieValue(req, cookieName) {
  const cookieHeader = req.get("cookie") || "";

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");
    if (rawName !== cookieName) {
      continue;
    }

    return decodeURIComponent(rawValueParts.join("=") || "");
  }

  return "";
}

export function normalizeImageExtension(filename) {
  const extension = path.extname((filename || "").trim()).toLowerCase();
  if (!extension) {
    return null;
  }

  if (extension === ".jpeg") {
    return ".jpg";
  }

  return imageExtensions.has(extension) ? extension : null;
}

export function isSupportedImageMimeType(mimeType) {
  return allowedImageMimeTypes.has(String(mimeType || "").toLowerCase());
}

function fileMatchesImageSignature(fileBuffer, mimeType) {
  const normalizedMimeType = String(mimeType || "").toLowerCase();

  if (normalizedMimeType === "image/png") {
    return fileBuffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  if (normalizedMimeType === "image/jpeg") {
    return (
      fileBuffer.length >= 3 &&
      fileBuffer[0] === 0xff &&
      fileBuffer[1] === 0xd8 &&
      fileBuffer[2] === 0xff
    );
  }

  if (normalizedMimeType === "image/gif") {
    const signature = fileBuffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (normalizedMimeType === "image/webp") {
    return (
      fileBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      fileBuffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export async function assertUploadedImageFile(file) {
  if (!file) {
    return;
  }

  if (!isSupportedImageMimeType(file.mimetype)) {
    await fs.rm(file.path, { force: true }).catch(() => undefined);
    throw new HttpError(400, "Unsupported image content type.");
  }

  const fileBuffer = await fs.readFile(file.path);
  if (!fileMatchesImageSignature(fileBuffer, file.mimetype)) {
    await fs.rm(file.path, { force: true }).catch(() => undefined);
    throw new HttpError(400, "Uploaded file content does not match a supported image format.");
  }
}

export function toPublicUploadPath(folderName, filename) {
  return `/uploads/${folderName}/${filename}`;
}

export async function deleteUploadedAsset(assetPath) {
  if (!assetPath || !assetPath.startsWith("/uploads/")) {
    return;
  }

  const relativePath = assetPath.slice("/uploads/".length);
  const absolutePath = path.resolve(appConfig.paths.uploadRoot, relativePath);
  const uploadRoot = path.resolve(appConfig.paths.uploadRoot);

  if (absolutePath !== uploadRoot && !absolutePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return;
  }

  await fs.rm(absolutePath, { force: true });
}

export function normalizeTableNumber(value) {
  return (value || "").trim().replace(/\s+/g, " ");
}

export function normalizeImagePosition(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 50;
  }

  return Math.max(0, Math.min(100, Math.round(parsedValue * 100) / 100));
}

export function normalizeRequestIp(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return null;
  }

  return rawValue.replace(/^::ffff:/, "").slice(0, 64) || null;
}

export function canTransitionOrderStatus(currentStatus, nextStatus) {
  const allowedStatuses = ownerOrderStatusTransitions[String(currentStatus || "").toLowerCase()];
  return Array.isArray(allowedStatuses) && allowedStatuses.includes(String(nextStatus || "").toLowerCase());
}

export function parseMoneyAmount(value, fieldLabel = "Amount") {
  const rawValue = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(rawValue)) {
    throw new HttpError(400, `${fieldLabel} must be a valid amount with up to 2 decimal places.`);
  }

  const amount = Number(rawValue);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new HttpError(400, `${fieldLabel} must be zero or greater.`);
  }

  if (amount > 1000000) {
    throw new HttpError(400, `${fieldLabel} exceeds the supported limit.`);
  }

  return amount;
}

export async function resolveTableNumber(executor, restaurantId, tableReference) {
  if (!tableReference) {
    return null;
  }

  const cleanedReference = String(tableReference).trim();
  if (!cleanedReference) {
    return null;
  }

  const candidates = [cleanedReference];
  const legacyPrefix = `${restaurantId}-`;
  if (cleanedReference.startsWith(legacyPrefix)) {
    const legacyValue = cleanedReference.slice(legacyPrefix.length).trim();
    if (legacyValue && !candidates.includes(legacyValue)) {
      candidates.push(legacyValue);
    }
  }

  for (const candidate of candidates) {
    const [rows] = await executor.execute(
      "SELECT table_number FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ? LIMIT 1",
      [restaurantId, candidate],
    );

    if (rows.length) {
      return rows[0].table_number;
    }
  }

  if (/^\d+$/.test(cleanedReference)) {
    const [rows] = await executor.execute(
      "SELECT table_number FROM restaurant_tables WHERE restaurant_id = ? AND id = ? LIMIT 1",
      [restaurantId, Number(cleanedReference)],
    );

    if (rows.length) {
      return rows[0].table_number;
    }
  }

  return null;
}

export function buildMenuTree(items) {
  const root = new Map();

  for (const item of items) {
    const segments = (item.category || "Other")
      .split(">")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const safeSegments = segments.length ? segments : ["Other"];

    let nodeMap = root;
    let activeNode = null;

    for (const segment of safeSegments) {
      if (!nodeMap.has(segment)) {
        nodeMap.set(segment, {
          name: segment,
          items: [],
          children: new Map(),
        });
      }

      activeNode = nodeMap.get(segment);
      nodeMap = activeNode.children;
    }

    activeNode.items.push({
      ...item,
      categoryPath: safeSegments.join(" > "),
    });
  }

  const finalize = (nodes) =>
    [...nodes.values()]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((node) => ({
        name: node.name,
        items: node.items.sort((left, right) => left.name.localeCompare(right.name)),
        children: finalize(node.children),
      }));

  return finalize(root);
}

export function formatRestaurant(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    country: row.country,
    address: row.address,
    phone: row.phone,
    active: Boolean(row.active),
    publicSlug: row.public_slug,
    imageUrl: row.image_path,
    imagePositionX: normalizeImagePosition(row.image_position_x),
    imagePositionY: normalizeImagePosition(row.image_position_y),
  };
}

export function formatMenuItem(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    active: row.active === undefined ? true : Boolean(row.active),
    imageUrl: row.image_path,
    imagePositionX: normalizeImagePosition(row.image_position_x),
    imagePositionY: normalizeImagePosition(row.image_position_y),
  };
}

export function formatOrder(row) {
  return {
    id: row.id,
    tableNumber: row.table_number,
    status: row.status,
    createdAt: row.created_at,
    totalAmount: Number(row.total_amount || 0),
    itemsSummary: row.items_summary || "",
  };
}

export function buildPublicOrderUrl(restaurantRef, tableNumber) {
  return `${appConfig.publicAppUrl}/order/${encodeURIComponent(restaurantRef)}?table=${encodeURIComponent(tableNumber)}`;
}

export async function createTableQrCode(restaurantId, restaurantRef, tableNumber) {
  const filename = `${slugify(`${restaurantId}-${tableNumber}`)}-${crypto.randomUUID().slice(0, 8)}.png`;
  const absolutePath = path.join(appConfig.paths.qrUploads, filename);
  const targetUrl = buildPublicOrderUrl(restaurantRef, tableNumber);

  await QRCode.toFile(absolutePath, targetUrl, {
    errorCorrectionLevel: "L",
    margin: 2,
    width: 320,
  });

  return {
    qrCodePath: toPublicUploadPath("qr-codes", filename),
    qrTargetUrl: targetUrl,
  };
}
