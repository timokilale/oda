import { appConfig } from "../config.js";
import { query, withTransaction } from "../db.js";
import { asyncHandler } from "../http/asyncHandler.js";
import { sanitizeOwner } from "../repository.js";
import {
  generateAuthToken,
  generateOtpCode,
  hashAuthToken,
  hashOtpCode,
  HttpError,
  normalizeRequestIp,
  readCookieValue,
  verifyOtpCode,
} from "../utils.js";

function buildAuthCookieOptions(expires) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure:
      appConfig.nodeEnv === "production" &&
      appConfig.publicAppUrl.startsWith("https://"),
    path: "/",
    expires,
  };
}

function setOwnerAuthCookie(res, rawToken, expiresAt) {
  res.cookie(
    appConfig.authTokenCookieName,
    rawToken,
    buildAuthCookieOptions(expiresAt),
  );
}

export function clearOwnerAuthCookie(res) {
  res.cookie(
    appConfig.authTokenCookieName,
    "",
    buildAuthCookieOptions(new Date(0)),
  );
}

export async function issueOwnerAuthToken(res, ownerId, userAgent) {
  const rawToken = generateAuthToken();
  const expiresAt = new Date(
    Date.now() + appConfig.authTokenTtlDays * 24 * 60 * 60 * 1000,
  );

  await query(
    `
      INSERT INTO owner_auth_tokens (owner_id, token_hash, user_agent, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    [
      ownerId,
      hashAuthToken(rawToken),
      String(userAgent || "").slice(0, 255) || null,
      expiresAt,
    ],
  );

  setOwnerAuthCookie(res, rawToken, expiresAt);
}

export async function revokeOwnerAuthToken(tokenId) {
  if (!tokenId) {
    return;
  }

  await query(
    "UPDATE owner_auth_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = ?",
    [tokenId],
  );
}

async function enforceOtpRequestLimit(connection, phoneNumber, purpose, requestIp) {
  const windowStart = new Date(
    Date.now() - appConfig.otpRequestWindowMinutes * 60 * 1000,
  );
  const [phoneRows] = await connection.execute(
    `
      SELECT COUNT(*) AS total
      FROM owner_auth_otps
      WHERE phone_number = ? AND purpose = ? AND created_at >= ?
    `,
    [phoneNumber, purpose, windowStart],
  );

  if (Number(phoneRows[0]?.total || 0) >= appConfig.otpMaxRequestsPerWindow) {
    throw new HttpError(429, "Too many OTP requests for this phone number. Try again later.");
  }

  if (!requestIp) {
    return;
  }

  const [ipRows] = await connection.execute(
    `
      SELECT COUNT(*) AS total
      FROM owner_auth_otps
      WHERE request_ip = ? AND purpose = ? AND created_at >= ?
    `,
    [requestIp, purpose, windowStart],
  );

  if (Number(ipRows[0]?.total || 0) >= appConfig.otpMaxRequestsPerIpWindow) {
    throw new HttpError(429, "Too many OTP requests from this network. Try again later.");
  }
}

export async function createOtp(phoneNumber, purpose, requestMeta = {}) {
  const otpCode = generateOtpCode(appConfig.otpLength);
  const expiresAt = new Date(
    Date.now() + appConfig.otpTtlMinutes * 60 * 1000,
  );
  const requestIp = normalizeRequestIp(requestMeta.requestIp);
  const userAgent = String(requestMeta.userAgent || "").slice(0, 255) || null;

  await withTransaction(async (connection) => {
    await enforceOtpRequestLimit(connection, phoneNumber, purpose, requestIp);

    await connection.execute(
      `
        UPDATE owner_auth_otps
        SET consumed_at = COALESCE(consumed_at, CURRENT_TIMESTAMP)
        WHERE phone_number = ? AND purpose = ? AND consumed_at IS NULL
      `,
      [phoneNumber, purpose],
    );

    await connection.execute(
      `
        INSERT INTO owner_auth_otps (phone_number, purpose, request_ip, user_agent, code_hash, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        phoneNumber,
        purpose,
        requestIp,
        userAgent,
        hashOtpCode(phoneNumber, purpose, otpCode),
        expiresAt,
      ],
    );
  });

  return otpCode;
}

export async function consumeOtp(connection, phoneNumber, purpose, otpCode) {
  const [rows] = await connection.execute(
    `
      SELECT id, code_hash, expires_at, consumed_at, attempt_count
      FROM owner_auth_otps
      WHERE phone_number = ? AND purpose = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [phoneNumber, purpose],
  );

  if (!rows.length) {
    throw new HttpError(400, "OTP expired. Request a new code.");
  }

  const otpRow = rows[0];
  const expiresAt = new Date(otpRow.expires_at);
  const maxAttempts = appConfig.otpMaxAttempts;

  if (otpRow.consumed_at || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await connection.execute(
      "UPDATE owner_auth_otps SET consumed_at = COALESCE(consumed_at, CURRENT_TIMESTAMP) WHERE id = ?",
      [otpRow.id],
    );
    throw new HttpError(400, "OTP expired. Request a new code.");
  }

  if (Number(otpRow.attempt_count || 0) >= maxAttempts) {
    await connection.execute(
      "UPDATE owner_auth_otps SET consumed_at = COALESCE(consumed_at, CURRENT_TIMESTAMP) WHERE id = ?",
      [otpRow.id],
    );
    throw new HttpError(429, "Too many invalid OTP attempts. Request a new code.");
  }

  if (!verifyOtpCode(phoneNumber, purpose, otpCode, otpRow.code_hash)) {
    const nextAttemptCount = Number(otpRow.attempt_count || 0) + 1;
    await connection.execute(
      `
        UPDATE owner_auth_otps
        SET attempt_count = ?, consumed_at = CASE WHEN ? >= ? THEN CURRENT_TIMESTAMP ELSE consumed_at END
        WHERE id = ?
      `,
      [nextAttemptCount, nextAttemptCount, maxAttempts, otpRow.id],
    );
    throw new HttpError(400, "Invalid OTP code.");
  }

  await connection.execute(
    "UPDATE owner_auth_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?",
    [otpRow.id],
  );
}

export function buildOtpPayload(message, otpCode = "") {
  const payload = { message };

  if (otpCode && appConfig.exposeDevOtp) {
    payload.devOtpCode = otpCode;
  }

  return payload;
}

export const ownerSessionMiddleware = asyncHandler(async (req, res, next) => {
  const rawToken = readCookieValue(req, appConfig.authTokenCookieName);
  if (!rawToken) {
    next();
    return;
  }

  const tokenRows = await query(
    `
      SELECT
        t.id AS token_id,
        o.id,
        o.phone_number,
        o.phone_verified_at,
        o.is_admin,
        o.can_manage_multiple_restaurants
      FROM owner_auth_tokens t
      JOIN owners o ON o.id = t.owner_id
      WHERE t.token_hash = ?
        AND t.revoked_at IS NULL
        AND t.expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [hashAuthToken(rawToken)],
  );

  const ownerRow = tokenRows[0];
  if (!ownerRow) {
    clearOwnerAuthCookie(res);
    next();
    return;
  }

  req.owner = sanitizeOwner(ownerRow);
  req.authTokenId = ownerRow.token_id;
  await query(
    "UPDATE owner_auth_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
    [ownerRow.token_id],
  ).catch(() => undefined);
  next();
});

export function requireOwner(req, res, next) {
  if (!req.owner) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (!req.owner) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  if (!req.owner.isAdmin) {
    res.status(403).json({ error: "Admin access required." });
    return;
  }

  next();
}
