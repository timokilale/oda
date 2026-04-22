import { useEffect, useState } from "react";
import ImagePositionField from "../components/ImagePositionField.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload, RESTAURANT_IMAGE_TARGET } from "../lib/cropImage.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

function buildInitialForm(restaurant) {
  return {
    restaurantName: restaurant.name || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    country: restaurant.country || "",
    phone: restaurant.phone || "",
    active: restaurant.active ? "true" : "false",
    restaurantImage: null,
    previewUrl: restaurant.imageUrl || "",
    removeImage: false,
    restaurantImagePositionX: restaurant.imagePositionX ?? 50,
    restaurantImagePositionY: restaurant.imagePositionY ?? 50,
  };
}

export default function RestaurantSettingsPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [form, setForm] = useState(() => buildInitialForm(restaurant));
  const [submitting, setSubmitting] = useState(false);

  usePageTitle(`Settings - ${restaurant.name}`);

  useEffect(() => {
    setForm(buildInitialForm(restaurant));
  }, [restaurant]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    clearFlash();

    const formData = new FormData();
    formData.set("restaurantName", form.restaurantName);
    formData.set("address", form.address);
    formData.set("city", form.city);
    formData.set("country", form.country);
    formData.set("phone", form.phone);
    formData.set("active", form.active);
    formData.set("removeImage", String(form.removeImage));
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
      await apiRequest(`/restaurants/${restaurant.id}`, {
        method: "PATCH",
        formData,
      });
      await refreshWorkspace();
      setFlash({ type: "success", message: "Restaurant settings saved." });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemoveImageToggle() {
    setForm((current) => ({
      ...current,
      removeImage: !current.removeImage,
      restaurantImage: null,
    }));
  }

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">Restaurant</p>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Update the details customers and staff rely on every day.
          </p>
        </div>
      </section>

      <section className="split-layout page-section">
        <div className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Profile</h2>
              <p className="field-help">
                Public links and existing table QR codes stay the same when you edit these details.
              </p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_name">
                Restaurant name
              </label>
              <input
                className="field-control"
                id="restaurant_settings_name"
                type="text"
                value={form.restaurantName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, restaurantName: event.target.value }))
                }
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_status">
                Visibility
              </label>
              <select
                className="field-control"
                id="restaurant_settings_status"
                value={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.value }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <p className="field-help">
                Inactive restaurants stay in your workspace but should be treated as paused.
              </p>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_address">
                Address
              </label>
              <textarea
                className="field-control"
                id="restaurant_settings_address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_city">
                City
              </label>
              <input
                className="field-control"
                id="restaurant_settings_city"
                type="text"
                placeholder="e.g. Nairobi"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_country">
                Country
              </label>
              <input
                className="field-control"
                id="restaurant_settings_country"
                type="text"
                placeholder="e.g. Kenya"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="restaurant_settings_phone">
                Service phone
              </label>
              <input
                className="field-control"
                id="restaurant_settings_phone"
                type="tel"
                inputMode="tel"
                placeholder="+254700000000"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>

            <ImagePositionField
              inputId="restaurant_settings_image"
              label="Restaurant image"
              file={form.restaurantImage}
              previewUrl={form.restaurantImage ? "" : form.removeImage ? "" : form.previewUrl}
              positionX={form.restaurantImagePositionX}
              positionY={form.restaurantImagePositionY}
              aspectRatio={RESTAURANT_IMAGE_TARGET.aspectRatio}
              disabled={submitting}
              onFileChange={(file) =>
                setForm((current) => ({
                  ...current,
                  restaurantImage: file,
                  removeImage: false,
                  restaurantImagePositionX: file ? 50 : current.restaurantImagePositionX,
                  restaurantImagePositionY: file ? 50 : current.restaurantImagePositionY,
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

            {(form.previewUrl || form.restaurantImage) ? (
              <div className="action-row">
                <button
                  type="button"
                  className={`button${form.removeImage ? " button-danger" : ""}`}
                  onClick={handleRemoveImageToggle}
                  disabled={submitting}
                >
                  {form.removeImage ? "Keep image" : "Remove image"}
                </button>
                {form.removeImage ? (
                  <span className="muted-text">The current image will be removed when you save.</span>
                ) : null}
              </div>
            ) : null}

            <div className="action-row">
              <button type="submit" className="button button-confirm" disabled={submitting}>
                {submitting ? "Saving" : "Save settings"}
              </button>
            </div>
          </form>
        </div>

        <div className="surface panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Status &amp; links</h2>
            </div>
          </div>

          <div className="stack-md">
            <div className="field-group">
              <span className="field-label">Visibility</span>
              <span
                className={`status-pill ${form.active === "true" ? "status-pill--active" : "status-pill--inactive"}`}
                role="status"
              >
                {form.active === "true" ? "Active - accepting orders" : "Inactive - ordering paused"}
              </span>
            </div>

            {restaurant.ref ? (
              <div className="field-group">
                <span className="field-label">Customer menu link</span>
                <p className="table-meta" style={{ wordBreak: "break-all" }}>
                  {`${window.location.origin}/order/${restaurant.ref}`}
                </p>
              </div>
            ) : null}

            <div className="field-group">
              <span className="field-label">How changes take effect</span>
              <p className="field-help" style={{ margin: 0 }}>
                The dashboard card, workspace header, and reports update after save.
                Customers see the latest restaurant name and photo the next time they open a table link.
                Existing QR codes and table links are not affected.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
