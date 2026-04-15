import express from "express";
import { query, withTransaction } from "../db.js";
import { asyncHandler } from "../http/asyncHandler.js";
import {
  getUploadedFileAsset,
  upload,
  validateUploadedRequestImage,
} from "../http/uploads.js";
import {
  createRestaurantForOwner,
  getOwnerById,
  getOwnerByPhoneNumber,
  sanitizeOwner,
} from "../repository.js";
import {
  buildOtpPayload,
  clearOwnerAuthCookie,
  consumeOtp,
  createOtp,
  issueOwnerAuthToken,
  requireOwner,
  revokeOwnerAuthToken,
} from "../services/ownerAuth.js";
import {
  deleteUploadedAsset,
  HttpError,
  isValidPhoneNumber,
  normalizeImagePosition,
  normalizePhoneNumber,
} from "../utils.js";

const router = express.Router();

router.get("/me", requireOwner, (req, res) => {
  res.json({ owner: req.owner });
});

router.post(
  "/register/request-otp",
  upload.single("restaurantImage"),
  asyncHandler(async (req, res) => {
    await validateUploadedRequestImage(req.file);

    const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
    const restaurantName = String(req.body.restaurantName || "").trim();
    const city = String(req.body.city || "").trim();
    const country = String(req.body.country || "").trim();
    const restaurantImagePositionX = normalizeImagePosition(req.body.restaurantImagePositionX);
    const restaurantImagePositionY = normalizeImagePosition(req.body.restaurantImagePositionY);
    const imagePath = getUploadedFileAsset(req.file);

    if (!isValidPhoneNumber(phoneNumber) || !restaurantName) {
      throw new HttpError(400, "A valid phone number and restaurant name are required.");
    }

    const existingOwner = await getOwnerByPhoneNumber(phoneNumber);
    if (existingOwner) {
      if (imagePath) {
        await deleteUploadedAsset(imagePath);
      }
      throw new HttpError(409, "An account with this phone number already exists.");
    }

    const pendingRows = await query(
      `
        SELECT image_path
        FROM pending_owner_registrations
        WHERE phone_number = ?
        LIMIT 1
      `,
      [phoneNumber],
    );

    const existingPendingImagePath = pendingRows[0]?.image_path || null;
    const resolvedImagePath = imagePath || existingPendingImagePath;

    if (imagePath && existingPendingImagePath && existingPendingImagePath !== imagePath) {
      await deleteUploadedAsset(existingPendingImagePath);
    }

    await query(
      `
        INSERT INTO pending_owner_registrations (
          phone_number,
          restaurant_name,
          city,
          country,
          image_path,
          image_position_x,
          image_position_y
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          restaurant_name = VALUES(restaurant_name),
          city = VALUES(city),
          country = VALUES(country),
          image_path = VALUES(image_path),
          image_position_x = VALUES(image_position_x),
          image_position_y = VALUES(image_position_y),
          created_at = CURRENT_TIMESTAMP
      `,
      [
        phoneNumber,
        restaurantName,
        city,
        country,
        resolvedImagePath,
        restaurantImagePositionX,
        restaurantImagePositionY,
      ],
    );

    const otpCode = await createOtp(phoneNumber, "register", {
      requestIp: req.ip || req.socket?.remoteAddress,
      userAgent: req.get("user-agent"),
    });

    res.status(202).json(
      buildOtpPayload("OTP generated for registration.", otpCode),
    );
  }),
);

router.post(
  "/register/verify-otp",
  asyncHandler(async (req, res) => {
    const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
    const otpCode = String(req.body.otpCode || "").trim();

    if (!isValidPhoneNumber(phoneNumber) || !otpCode) {
      throw new HttpError(400, "A valid phone number and OTP are required.");
    }

    const ownerId = await withTransaction(async (connection) => {
      await consumeOtp(connection, phoneNumber, "register", otpCode);

      const [pendingRows] = await connection.execute(
        `
          SELECT
            phone_number,
            restaurant_name,
            city,
            country,
            image_path,
            image_position_x,
            image_position_y
          FROM pending_owner_registrations
          WHERE phone_number = ?
          LIMIT 1
          FOR UPDATE
        `,
        [phoneNumber],
      );

      if (!pendingRows.length) {
        throw new HttpError(400, "Registration request expired. Send a new OTP.");
      }

      const existingOwner = await getOwnerByPhoneNumber(phoneNumber, connection);
      if (existingOwner) {
        throw new HttpError(409, "An account with this phone number already exists.");
      }

      const pendingRegistration = pendingRows[0];
      const [ownerResult] = await connection.execute(
        `
          INSERT INTO owners (phone_number, phone_verified_at)
          VALUES (?, CURRENT_TIMESTAMP)
        `,
        [phoneNumber],
      );

      await createRestaurantForOwner(
        connection,
        ownerResult.insertId,
        pendingRegistration.restaurant_name,
        pendingRegistration.city,
        pendingRegistration.country,
        pendingRegistration.image_path,
        pendingRegistration.image_position_x,
        pendingRegistration.image_position_y,
      );

      await connection.execute(
        "DELETE FROM pending_owner_registrations WHERE phone_number = ?",
        [phoneNumber],
      );

      return ownerResult.insertId;
    });

    await issueOwnerAuthToken(res, ownerId, req.get("user-agent"));

    const ownerRow = await getOwnerById(ownerId);
    res.json({ owner: sanitizeOwner(ownerRow) });
  }),
);

router.post(
  "/login/request-otp",
  asyncHandler(async (req, res) => {
    const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);

    if (!isValidPhoneNumber(phoneNumber)) {
      throw new HttpError(400, "Enter a valid phone number.");
    }

    const ownerRow = await getOwnerByPhoneNumber(phoneNumber);
    let otpCode = "";

    if (ownerRow?.phone_verified_at) {
      otpCode = await createOtp(phoneNumber, "login", {
        requestIp: req.ip || req.socket?.remoteAddress,
        userAgent: req.get("user-agent"),
      });
    }

    res.status(202).json(
      buildOtpPayload(
        ownerRow?.phone_verified_at
          ? "OTP generated for login."
          : "If the phone number is registered, an OTP has been generated.",
        otpCode,
      ),
    );
  }),
);

router.post(
  "/login/verify-otp",
  asyncHandler(async (req, res) => {
    const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
    const otpCode = String(req.body.otpCode || "").trim();

    if (!isValidPhoneNumber(phoneNumber) || !otpCode) {
      throw new HttpError(400, "A valid phone number and OTP are required.");
    }

    const ownerId = await withTransaction(async (connection) => {
      await consumeOtp(connection, phoneNumber, "login", otpCode);

      const ownerRow = await getOwnerByPhoneNumber(phoneNumber, connection);
      if (!ownerRow?.phone_verified_at) {
        throw new HttpError(401, "This phone number is not registered.");
      }

      return ownerRow.id;
    });

    await issueOwnerAuthToken(res, ownerId, req.get("user-agent"));

    const ownerRow = await getOwnerById(ownerId);
    res.json({ owner: sanitizeOwner(ownerRow) });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await revokeOwnerAuthToken(req.authTokenId);
    clearOwnerAuthCookie(res);
    res.status(204).end();
  }),
);

export default router;
