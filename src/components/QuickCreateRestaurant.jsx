import { useState } from "react";
import { createCroppedUpload, RESTAURANT_IMAGE_TARGET } from "../lib/cropImage.js";
import { apiRequest } from "../lib/api.js";
import ImagePositionField from "./ImagePositionField.jsx";

const initialState = {
  restaurantName: "",
  city: "",
  country: "",
  restaurantImage: null,
  restaurantImagePositionX: 50,
  restaurantImagePositionY: 50,
};

export default function QuickCreateRestaurant({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.set("restaurantName", form.restaurantName);
    formData.set("city", form.city);
    formData.set("country", form.country);
    formData.set("restaurantImagePositionX", String(form.restaurantImagePositionX));
    formData.set("restaurantImagePositionY", String(form.restaurantImagePositionY));

    if (form.restaurantImage) {
      const croppedImage = await createCroppedUpload(form.restaurantImage, {
        ...RESTAURANT_IMAGE_TARGET,
        positionX: form.restaurantImagePositionX,
        positionY: form.restaurantImagePositionY,
      });
      formData.set("restaurantImage", croppedImage);
    }

    try {
      const data = await apiRequest("/restaurants", {
        method: "POST",
        formData,
      });

      setForm(initialState);
      setOpen(false);
      await onCreated?.(data.restaurant);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setError("");
    setForm(initialState);
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => setOpen(true)}
        >
          New restaurant
        </button>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(calc(100vw-32px),420px)] max-h-[calc(100dvh-100px)] overflow-y-auto rounded-xl border border-border bg-card shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-medium text-foreground">New restaurant</span>
            <button
              type="button"
              className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              onClick={handleClose}
              disabled={submitting}
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="quick_create_restaurant_name">
                Restaurant name
              </label>
              <input
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
                id="quick_create_restaurant_name"
                type="text"
                placeholder="Restaurant"
                value={form.restaurantName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    restaurantName: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="quick_create_restaurant_city">
                City
              </label>
              <input
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
                id="quick_create_restaurant_city"
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="quick_create_restaurant_country">
                Country
              </label>
              <input
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
                id="quick_create_restaurant_country"
                type="text"
                placeholder="Country"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    country: event.target.value,
                  }))
                }
              />
            </div>
            <ImagePositionField
              inputId="quick_create_restaurant_image"
              label="Image"
              file={form.restaurantImage}
              positionX={form.restaurantImagePositionX}
              positionY={form.restaurantImagePositionY}
              aspectRatio={RESTAURANT_IMAGE_TARGET.aspectRatio}
              onFileChange={(file) =>
                setForm((current) => ({
                  ...current,
                  restaurantImage: file,
                  restaurantImagePositionX: 50,
                  restaurantImagePositionY: 50,
                }))
              }
              onPositionChange={({ x, y }) =>
                setForm((current) => ({
                  ...current,
                  restaurantImagePositionX: x,
                  restaurantImagePositionY: y,
                }))
              }
            />
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            ) : null}
            <div className="flex items-center gap-2 pt-2">
              <button type="submit" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={submitting}>
                {submitting ? "Creating" : "Create"}
              </button>
              <button type="button" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50" onClick={handleClose} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
