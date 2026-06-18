import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import ImagePositionField from "../components/ImagePositionField.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload, RESTAURANT_IMAGE_TARGET } from "../lib/cropImage.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import SettingsView from "../components/management/SettingsView.jsx";

function buildInitialForm(restaurant) {
  return {
    restaurantName: restaurant.name || "",
    address: restaurant.address || "",
    city: restaurant.city || "",
    country: restaurant.country || "",
    phone: restaurant.phone || "",
    active: restaurant.active ? "true" : "false",
    autoAccept: false,
    soundEnabled: true,
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
  const [savingRestomanage, setSavingRestomanage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
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

  const handleSaveRestomanage = useCallback(async () => {
    setSavingRestomanage(true);
    clearFlash();
    try {
      const formData = new FormData();
      formData.set("restaurantName", form.restaurantName);
      formData.set("city", form.branchName || form.city);
      formData.set("active", form.active);
      await apiRequest(`/restaurants/${restaurant.id}`, { method: "PATCH", formData });
      await refreshWorkspace();
      setFlash({ type: "success", message: "Settings saved." });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSavingRestomanage(false);
    }
  }, [restaurant.id, form.restaurantName, form.branchName, form.active, refreshWorkspace, setFlash, clearFlash]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);
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
      setSavingProfile(false);
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
      <section className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6 mb-8">
        <SettingsView
          restaurantName={form.restaurantName}
          onRestaurantNameChange={(v) => setForm((c) => ({ ...c, restaurantName: v }))}
          branchName={form.branchName || form.city || ''}
          onBranchNameChange={(v) => setForm((c) => ({ ...c, branchName: v, city: v }))}
          soundEnabled={form.soundEnabled}
          onSoundEnabledChange={(v) => setForm((c) => ({ ...c, soundEnabled: v }))}
          autoAccept={form.autoAccept}
          onAutoAcceptChange={(v) => setForm((c) => ({ ...c, autoAccept: v }))}
          onSave={handleSaveRestomanage}
          saving={savingRestomanage}
        />

        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
            <h2 className="font-sans text-lg font-bold text-neutral-800 dark:text-white mb-6">Profile Details</h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="restaurant_settings_address">
                  Address
                </label>
                <textarea
                  className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white resize-y min-h-[80px]"
                  id="restaurant_settings_address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="restaurant_settings_city">
                    City
                  </label>
                  <input
                    className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white"
                    id="restaurant_settings_city"
                    type="text"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="restaurant_settings_country">
                    Country
                  </label>
                  <input
                    className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white"
                    id="restaurant_settings_country"
                    type="text"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, country: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5" htmlFor="restaurant_settings_phone">
                  Service phone
                </label>
                <input
                  className="w-full bg-white dark:bg-neutral-850 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all text-sm dark:text-white"
                  id="restaurant_settings_phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Restaurant image</label>
                <ImagePositionField
                  inputId="restaurant_settings_image"
                  label=""
                  file={form.restaurantImage}
                  previewUrl={form.restaurantImage ? "" : form.removeImage ? "" : form.previewUrl}
                  positionX={form.restaurantImagePositionX}
                  positionY={form.restaurantImagePositionY}
                  aspectRatio={RESTAURANT_IMAGE_TARGET.aspectRatio}
                  disabled={savingProfile}
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
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-xl font-sans text-[11px] font-bold uppercase tracking-wider border transition-all ${
                        form.removeImage
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                      onClick={handleRemoveImageToggle}
                      disabled={savingProfile}
                    >
                      {form.removeImage ? "Keep image" : "Remove image"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center bg-[#2a14b4] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl px-6 py-2.5 hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-2xl p-6 shadow-xs">
            <h2 className="font-sans text-lg font-bold text-neutral-800 dark:text-white mb-6">Account</h2>

            <div className="space-y-6">
              <div className="bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl p-4">
                <span className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Phone Number</span>
                <p className="font-sans text-sm font-semibold text-neutral-800 dark:text-white">{owner?.phoneNumber}</p>
                {!changingPhone ? (
                  <button
                    type="button"
                    onClick={() => setChangingPhone(true)}
                    className="mt-3 inline-flex items-center justify-center border border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 font-sans text-[11px] font-bold uppercase tracking-wider rounded-xl px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                  >
                    Change phone number
                  </button>
                ) : (
                  <form className="space-y-3 mt-4" onSubmit={phoneOtpSent ? handleVerifyPhoneOtp : handleRequestPhoneOtp}>
                    <div>
                      <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1" htmlFor="new_phone_number">
                        New phone number
                      </label>
                      <input
                        className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white"
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
                      <div>
                        <label className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1" htmlFor="phone_otp_code">
                          Confirmation code
                        </label>
                        <input
                          className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#4338ca]/20 outline-none transition-all dark:text-white"
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
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 font-sans text-xs text-amber-800">
                        Dev OTP: <strong>{devPhoneOtp}</strong>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center bg-[#2a14b4] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl px-5 py-2 hover:opacity-90 transition-all disabled:opacity-50"
                        disabled={phoneSubmitting || newPhoneNumber.length < 6}
                      >
                        {phoneSubmitting
                          ? phoneOtpSent ? "Verifying..." : "Sending..."
                          : phoneOtpSent ? "Verify & update" : "Send OTP"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center border border-[#E5E7EB] dark:border-neutral-800 text-neutral-500 font-sans text-xs font-bold uppercase tracking-wider rounded-xl px-5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
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

              <div className="bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Visibility</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider ${
                      form.active === "true"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                    role="status"
                  >
                    {form.active === "true" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {restaurant.ref ? (
                <div className="bg-[#f3f4f5]/65 dark:bg-neutral-850/50 rounded-xl p-4">
                  <span className="block font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Customer Menu Link</span>
                  <p className="font-sans text-xs text-neutral-700 dark:text-neutral-300 break-all font-medium">
                    {`${window.location.origin}/order/${restaurant.ref}`}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
