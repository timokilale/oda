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
    <details
      className="quick-create"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="button button-confirm">New restaurant</summary>
      <form onSubmit={handleSubmit} className="quick-create__panel">
        <div className="field-group">
          <label className="field-label" htmlFor="quick_create_restaurant_name">
            Restaurant name
          </label>
          <input
            className="field-control quick-create__input"
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
        <div className="field-group">
          <label className="field-label" htmlFor="quick_create_restaurant_city">
            City
          </label>
          <input
            className="field-control quick-create__input"
            id="quick_create_restaurant_city"
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(event) =>
              setForm((current) => ({ ...current, city: event.target.value }))
            }
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="quick_create_restaurant_country">
            Country
          </label>
          <input
            className="field-control quick-create__input"
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
          <div className="field-error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="action-row">
          <button type="submit" className="button button-confirm" disabled={submitting}>
            {submitting ? "Creating" : "Create"}
          </button>
          <button type="button" className="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </details>
  );
}
