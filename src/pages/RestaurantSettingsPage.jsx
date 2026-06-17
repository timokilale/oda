import { useEffect, useState } from "react";
import ImagePositionField from "../components/ImagePositionField.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload, RESTAURANT_IMAGE_TARGET } from "../lib/cropImage.js";
import { useAuth } from "../context/AuthContext.jsx";
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
  const { owner, requestChangePhoneOtp, verifyChangePhoneOtp } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(restaurant));
  const [submitting, setSubmitting] = useState(false);
  const [changingPhone, setChangingPhone] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [devPhoneOtp, setDevPhoneOtp] = useState("");

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
      setFlash({ type: "success", message: "Settings saved." });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  function resetPhoneFlow() {
    setPhoneOtpSent(false);
    setDevPhoneOtp("");
    setPhoneOtpCode("");
  }

  async function handleRequestPhoneOtp(event) {
    event?.preventDefault();
    setPhoneSubmitting(true);
    clearFlash();

    try {
      const data = await requestChangePhoneOtp(newPhoneNumber);
      setPhoneOtpSent(true);
      setDevPhoneOtp(data.devOtpCode || "");
      setFlash({ type: "success", message: data.message });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setPhoneSubmitting(false);
    }
  }

  async function handleVerifyPhoneOtp(event) {
    event.preventDefault();
    setPhoneSubmitting(true);
    clearFlash();

    try {
      await verifyChangePhoneOtp({
        newPhoneNumber,
        otpCode: phoneOtpCode,
      });
      setFlash({ type: "success", message: "Phone number updated." });
      setChangingPhone(false);
      resetPhoneFlow();
      setNewPhoneNumber("");
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setPhoneSubmitting(false);
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
      <section className="py-6">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              Settings
            </h1>
        </div>
      </section>

      <section className="grid grid-cols-[320px_1fr] gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_name">
                Restaurant name
              </label>
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="restaurant_settings_name"
                type="text"
                value={form.restaurantName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, restaurantName: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_status">
                Visibility
              </label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="restaurant_settings_status"
                value={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.value }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_address">
                Address
              </label>
              <textarea
                className="h-10 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors resize-y"
                id="restaurant_settings_address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_city">
                City
              </label>
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="restaurant_settings_city"
                type="text"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_country">
                Country
              </label>
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="restaurant_settings_country"
                type="text"
                value={form.country}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="restaurant_settings_phone">
                Service phone
              </label>
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="restaurant_settings_phone"
                type="tel"
                inputMode="tel"
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                    form.removeImage
                      ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                  onClick={handleRemoveImageToggle}
                  disabled={submitting}
                >
                  {form.removeImage ? "Keep image" : "Remove image"}
                </button>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Saving" : "Save"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Status &amp; links</h2>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground">Phone number</span>
              <p className="text-sm text-foreground">{owner?.phoneNumber}</p>
              {!changingPhone ? (
                <button
                  type="button"
                  onClick={() => setChangingPhone(true)}
                  className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors w-fit mt-1"
                >
                  Change phone number
                </button>
              ) : (
                <form className="grid gap-3 mt-2" onSubmit={phoneOtpSent ? handleVerifyPhoneOtp : handleRequestPhoneOtp}>
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="new_phone_number">
                      New phone number
                    </label>
                    <input
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                      id="new_phone_number"
                      type="tel"
                      inputMode="numeric"
                      placeholder="+2557XXXXXXXX"
                      value={newPhoneNumber}
                      onChange={(e) => {
                        setNewPhoneNumber(e.target.value);
                        if (phoneOtpSent) resetPhoneFlow();
                      }}
                      disabled={phoneOtpSent || phoneSubmitting}
                      required
                    />
                  </div>

                  {phoneOtpSent ? (
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium text-foreground" htmlFor="phone_otp_code">
                        Confirmation code
                      </label>
                      <input
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                        id="phone_otp_code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter the 6-digit code"
                        value={phoneOtpCode}
                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/[^\d]/g, ""))}
                        required
                        autoFocus
                      />
                    </div>
                  ) : null}

                  {import.meta.env.DEV && phoneOtpSent && devPhoneOtp ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
                      Dev OTP: <strong>{devPhoneOtp}</strong>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={phoneSubmitting || newPhoneNumber.length < 6}
                    >
                      {phoneSubmitting
                        ? phoneOtpSent ? "Verifying" : "Sending"
                        : phoneOtpSent ? "Verify & update" : "Send OTP"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                      onClick={() => {
                        setChangingPhone(false);
                        resetPhoneFlow();
                        setNewPhoneNumber("");
                      }}
                      disabled={phoneSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground">Visibility</span>
              <span
                className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium border uppercase tracking-wider w-fit ${
                  form.active === "true"
                    ? "border-success/30 bg-success/15 text-success"
                    : "border-border bg-muted text-muted-foreground"
                }`}
                role="status"
              >
                {form.active === "true" ? "Active" : "Inactive"}
              </span>
            </div>

            {restaurant.ref ? (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-foreground">Customer menu link</span>
                <p className="text-sm text-foreground break-all">
                  {`${window.location.origin}/order/${restaurant.ref}`}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
