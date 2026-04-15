import path from "node:path";
import multer from "multer";
import { appConfig } from "../config.js";
import {
  assertUploadedImageFile,
  HttpError,
  isSupportedImageMimeType,
  normalizeImageExtension,
  slugify,
  toPublicUploadPath,
} from "../utils.js";

export function getUploadFolderName(fieldName) {
  if (fieldName === "restaurantImage") {
    return "restaurants";
  }

  if (fieldName === "image") {
    return "menu-items";
  }

  return null;
}

function getUploadDestination(fieldName) {
  const folderName = getUploadFolderName(fieldName);

  if (folderName === "restaurants") {
    return appConfig.paths.restaurantUploads;
  }

  if (folderName === "menu-items") {
    return appConfig.paths.menuUploads;
  }

  return appConfig.paths.uploadRoot;
}

export function getUploadedFileAsset(file) {
  if (!file) {
    return null;
  }

  const folderName = getUploadFolderName(file.fieldname);
  return folderName ? toPublicUploadPath(folderName, file.filename) : null;
}

export async function validateUploadedRequestImage(file) {
  if (!file) {
    return;
  }

  await assertUploadedImageFile(file);
}

const uploadStorage = multer.diskStorage({
  destination(_req, file, callback) {
    callback(null, getUploadDestination(file.fieldname));
  },
  filename(_req, file, callback) {
    const extension = normalizeImageExtension(file.originalname);
    if (!extension) {
      callback(new HttpError(400, "Unsupported image format."));
      return;
    }

    const baseName = slugify(path.basename(file.originalname, path.extname(file.originalname)));
    callback(null, `${baseName}-${Date.now()}${extension}`);
  },
});

export const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    if (!normalizeImageExtension(file.originalname) || !isSupportedImageMimeType(file.mimetype)) {
      callback(new HttpError(400, "Unsupported image format."));
      return;
    }

    callback(null, true);
  },
});
