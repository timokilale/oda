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
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor={inputId}>
          {label}
        </label>
        <input
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          id={inputId}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
        />
      </div>

      <div
        ref={frameRef}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
          resolvedPreviewUrl
            ? dragging
              ? "border-primary cursor-grabbing"
              : "border-border hover:border-muted-foreground cursor-grab"
            : "border-border bg-muted/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ aspectRatio: String(aspectRatio) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
      >
        {resolvedPreviewUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url("${resolvedPreviewUrl}")`,
                backgroundPosition: `${safePositionX}% ${safePositionY}%`,
              }}
            />
            <span
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white bg-primary/60 shadow-md pointer-events-none"
              style={{ left: `${safePositionX}%`, top: `${safePositionY}%` }}
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/60 p-4 text-center select-none">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 mb-2 opacity-40">
              <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="14" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 26l8-8 6 6 4-4 6 6 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="w-full">Choose an image, then drag to frame it.</p>
          </div>
        )}
      </div>

      {resolvedPreviewUrl ? (
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono shrink-0 w-16">Pan</span>
            <input
              className="flex-1 h-1 rounded-full appearance-none bg-border accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={safePositionX}
              disabled={disabled}
              onChange={(event) => updatePosition(event.target.value, safePositionY)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono shrink-0 w-16">Tilt</span>
            <input
              className="flex-1 h-1 rounded-full appearance-none bg-border accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm"
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={safePositionY}
              disabled={disabled}
              onChange={(event) => updatePosition(safePositionX, event.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
