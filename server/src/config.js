import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const uploadRoot = path.join(projectRoot, "server", "uploads");

export const categorySuggestions = [
  "Main dishes",
  "Starters",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Desserts",
  "Drinks",
  "Sides",
  "Specials",
  "Other",
];

export const validOwnerOrderStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export const ownerOrderStatusTransitions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const appConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  authSecret:
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "dev-secret-key-change-me",
  publicAppUrl: (process.env.PUBLIC_APP_URL || "http://localhost:5173").replace(/\/$/, ""),
  frontendDevUrl: (process.env.FRONTEND_DEV_URL || "").replace(/\/$/, ""),
  authTokenCookieName: process.env.AUTH_TOKEN_COOKIE_NAME || "oda_owner_token",
  authTokenTtlDays: Number(process.env.AUTH_TOKEN_TTL_DAYS || 30),
  otpLength: Number(process.env.OTP_LENGTH || 6),
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 10),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpRequestWindowMinutes: Number(process.env.OTP_REQUEST_WINDOW_MINUTES || 15),
  otpMaxRequestsPerWindow: Number(process.env.OTP_MAX_REQUESTS_PER_WINDOW || 3),
  otpMaxRequestsPerIpWindow: Number(process.env.OTP_MAX_REQUESTS_PER_IP_WINDOW || 10),
  exposeDevOtp:
    (process.env.NODE_ENV || "development") !== "production" &&
    process.env.EXPOSE_DEV_OTP === "true",
  mysql: {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "oda_cloud",
  },
  paths: {
    projectRoot,
    uploadRoot,
    restaurantUploads: path.join(uploadRoot, "restaurants"),
    menuUploads: path.join(uploadRoot, "menu-items"),
    qrUploads: path.join(uploadRoot, "qr-codes"),
    clientDist: path.join(projectRoot, "dist"),
  },
};
