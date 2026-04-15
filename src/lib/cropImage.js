const OUTPUT_TYPES = {
  "image/jpeg": { extension: "jpg", quality: 0.9 },
  "image/png": { extension: "png" },
  "image/webp": { extension: "webp", quality: 0.92 },
};

export const RESTAURANT_IMAGE_TARGET = {
  width: 1200,
  height: 900,
  aspectRatio: 4 / 3,
};

export const MENU_IMAGE_TARGET = {
  width: 1280,
  height: 960,
  aspectRatio: 4 / 3,
};

function clampPosition(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return Math.max(0, Math.min(100, numericValue));
}

function resolveOutputSettings(fileType) {
  return OUTPUT_TYPES[fileType] || OUTPUT_TYPES["image/jpeg"];
}

async function loadImageSource(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the uploaded image."));
    };

    image.src = url;
  });
}

function buildOutputFilename(fileName, extension) {
  const stem = String(fileName || "upload")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "upload";

  return `${stem}-cropped.${extension}`;
}

export async function createCroppedUpload(file, { positionX = 50, positionY = 50, width, height }) {
  if (!file) {
    return null;
  }

  const source = await loadImageSource(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  const targetRatio = width / height;
  const sourceRatio = sourceWidth / sourceHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
  } else if (sourceRatio < targetRatio) {
    cropHeight = sourceWidth / targetRatio;
  }

  const maxOffsetX = Math.max(0, sourceWidth - cropWidth);
  const maxOffsetY = Math.max(0, sourceHeight - cropHeight);
  const cropX = maxOffsetX * (clampPosition(positionX) / 100);
  const cropY = maxOffsetY * (clampPosition(positionY) / 100);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    if (typeof source.close === "function") {
      source.close();
    }
    throw new Error("Could not prepare the cropped image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    source,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height,
  );

  if (typeof source.close === "function") {
    source.close();
  }

  const output = resolveOutputSettings(file.type);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (!value) {
          reject(new Error("Could not export the cropped image."));
          return;
        }

        resolve(value);
      },
      Object.keys(OUTPUT_TYPES).includes(file.type) ? file.type : "image/jpeg",
      output.quality,
    );
  });

  return new File([blob], buildOutputFilename(file.name, output.extension), {
    type: blob.type,
    lastModified: Date.now(),
  });
}
