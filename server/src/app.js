import fs from "node:fs";
import path from "node:path";
import express from "express";
import { appConfig } from "./config.js";
import { query } from "./db.js";
import { errorHandler } from "./http/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { ensureSchema } from "./schema.js";
import { ownerSessionMiddleware } from "./services/ownerAuth.js";
import { ensureStorageDirs } from "./utils.js";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(appConfig.paths.uploadRoot));
app.use(ownerSessionMiddleware);

app.get("/api/health", async (_req, res, next) => {
  try {
    await query("SELECT 1 AS ok");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

const clientDistExists = fs.existsSync(appConfig.paths.clientDist);

function buildDevClientUrl(req) {
  if (appConfig.frontendDevUrl) {
    return `${appConfig.frontendDevUrl}${req.originalUrl}`;
  }

  const hostHeader = req.get("host") || `localhost:${appConfig.port}`;
  const [hostname] = hostHeader.split(":");
  return `http://${hostname}:5173${req.originalUrl}`;
}

if (clientDistExists) {
  app.use(express.static(appConfig.paths.clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(appConfig.paths.clientDist, "index.html"));
  });
} else {
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.redirect(302, buildDevClientUrl(req));
  });
}

app.use(errorHandler);

export async function startServer() {
  await ensureStorageDirs();
  await ensureSchema();

  return new Promise((resolve) => {
    const server = app.listen(appConfig.port, () => {
      console.log(`ODA mobile server listening on http://localhost:${appConfig.port}`);
      resolve(server);
    });
  });
}
