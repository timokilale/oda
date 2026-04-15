import { useEffect, useRef, useState } from "react";

function clampPosition(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 50;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue * 100) / 100));
}

export default function ImagePositionField({
  inputId,
  label,
  file,
  previewUrl,
  positionX,
  positionY,
  aspectRatio = 4 / 3,
  onFileChange,
  onPositionChange,
  disabled = false,
}) {
  const frameRef = useRef(null);
  const draggingPointerIdRef = useRef(null);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(previewUrl || "");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (previewUrl) {
      setResolvedPreviewUrl(previewUrl);
      return undefined;
    }

    if (!file) {
      setResolvedPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setResolvedPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file, previewUrl]);

  function updatePosition(nextX, nextY) {
    onPositionChange?.({
      x: clampPosition(nextX),
      y: clampPosition(nextY),
    });
  }

  function updatePositionFromPointer(event) {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const bounds = frame.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }

    const nextX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const nextY = ((event.clientY - bounds.top) / bounds.height) * 100;
    updatePosition(nextX, nextY);
  }

  function handlePointerDown(event) {
    if (!resolvedPreviewUrl || disabled) {
      return;
    }

    event.preventDefault();
    draggingPointerIdRef.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePositionFromPointer(event);
  }

  function handlePointerMove(event) {
    if (draggingPointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updatePositionFromPointer(event);
  }

  function handlePointerRelease(event) {
    if (draggingPointerIdRef.current !== event.pointerId) {
      return;
    }

    draggingPointerIdRef.current = null;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const safePositionX = clampPosition(positionX);
  const safePositionY = clampPosition(positionY);

  return (
    <div className="image-position-field">
      <div className="field-group">
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
        <input
          className="field-control"
          id={inputId}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
        />
      </div>

      <div
        ref={frameRef}
        className={`image-position-field__frame${resolvedPreviewUrl ? "" : " is-empty"}${
          dragging ? " is-dragging" : ""
        }${disabled ? " is-disabled" : ""}`}
        style={{ aspectRatio: String(aspectRatio) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
      >
        {resolvedPreviewUrl ? (
          <>
            <div
              className="image-position-field__preview"
              style={{
                backgroundImage: `url("${resolvedPreviewUrl}")`,
                backgroundPosition: `${safePositionX}% ${safePositionY}%`,
              }}
            />
            <span
              className="image-position-field__focus"
              style={{ left: `${safePositionX}%`, top: `${safePositionY}%` }}
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="image-position-field__placeholder">
            Upload an image, then drag it inside the frame to set the crop.
          </div>
        )}
      </div>

      <div className="image-position-field__hint">
        Fixed frame. Drag the preview, or fine-tune the sliders below.
      </div>

      {resolvedPreviewUrl ? (
        <div className="image-position-field__controls">
          <label className="image-position-field__slider-row">
            <span className="image-position-field__slider-label">Horizontal</span>
            <input
              className="image-position-field__slider"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={safePositionX}
              disabled={disabled}
              onChange={(event) => updatePosition(event.target.value, safePositionY)}
            />
            <span className="image-position-field__slider-value">{Math.round(safePositionX)}%</span>
          </label>

          <label className="image-position-field__slider-row">
            <span className="image-position-field__slider-label">Vertical</span>
            <input
              className="image-position-field__slider"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={safePositionY}
              disabled={disabled}
              onChange={(event) => updatePosition(safePositionX, event.target.value)}
            />
            <span className="image-position-field__slider-value">{Math.round(safePositionY)}%</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
