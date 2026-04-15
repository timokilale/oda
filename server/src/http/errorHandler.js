import multer from "multer";
import { deleteUploadedAsset, HttpError } from "../utils.js";
import { getUploadedFileAsset } from "./uploads.js";

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  const uploadedFile = getUploadedFileAsset(req.file);

  if (statusCode >= 500) {
    console.error(error);
  }

  if (uploadedFile) {
    deleteUploadedAsset(uploadedFile).catch(() => undefined);
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof HttpError) {
    res.status(statusCode).json({ error: error.message });
    return;
  }

  res.status(statusCode).json({ error: error.message || "Unexpected server error." });
}
