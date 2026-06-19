import { useCallback, useEffect, useRef, useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ToggleSwitch from "../components/ui/ToggleSwitch.jsx";

function buildInitialForm(restaurant) {
  return {
    restaurantName: restaurant.name || "",
    city: restaurant.city || "",
    address: restaurant.address || "",
    phone: restaurant.phone || "",
    country: restaurant.country || "",
    active: restaurant.active !== false,
    autoAccept: false,
    soundEnabled: true,
  };
}

export default function RestaurantSettingsPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const { toast } = useToast();
  const [form, setForm] = useState(() => buildInitialForm(restaurant));
  const [saving, setSaving] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  usePageTitle(`Settings - ${restaurant.name}`);

  useEffect(() => {
    setForm(buildInitialForm(restaurant));
  }, [restaurant]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowImageMenu(false);
      }
    }
    if (showImageMenu) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showImageMenu]);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    clearFlash();

    const formData = new FormData();
    formData.set("restaurantName", form.restaurantName);
    formData.set("city", form.city);
    formData.set("address", form.address);
    formData.set("phone", form.phone);
    formData.set("country", form.country);
    formData.set("active", form.active ? "true" : "false");

    try {
      await apiRequest(`/restaurants/${restaurant.id}`, { method: "PATCH", formData });
      await refreshWorkspace();
      setFlash({ type: "success", message: "Settings saved." });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file) {
    setShowImageMenu(false);
    if (!file) return;

    clearFlash();
    const formData = new FormData();
    formData.set("restaurantImage", file);

    try {
      await apiRequest(`/restaurants/${restaurant.id}`, { method: "PATCH", formData });
      await refreshWorkspace();
      toast({ type: "success", title: "Image updated" });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleRemoveImage() {
    setShowImageMenu(false);
    clearFlash();

    const formData = new FormData();
    formData.set("removeImage", "true");

    try {
      await apiRequest(`/restaurants/${restaurant.id}`, { method: "PATCH", formData });
      await refreshWorkspace();
      toast({ type: "success", title: "Image removed" });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSave} className="bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col items-center pb-2">
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowImageMenu(!showImageMenu)}
              className="cursor-pointer"
            >
              {restaurant.imageUrl ? (
                <img
                  src={restaurant.imageUrl}
                  alt={restaurant.name}
                  className="w-20 h-20 rounded-full object-cover border border-[#E5E7EB] dark:border-neutral-700 hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-300 font-sans text-lg font-medium hover:opacity-80 transition-opacity">
                  {(restaurant.name || "R")[0]}
                </div>
              )}
            </button>

            {showImageMenu && (
              <div
                ref={menuRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-36 bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg shadow-lg z-10 py-1"
              >
                {restaurant.imageUrl && (
                  <button
                    type="button"
                    onClick={() => { setShowImageMenu(false); setViewingImage(true); }}
                    className="w-full text-left px-4 py-2 text-xs font-sans text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-4 py-2 text-xs font-sans text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Edit
                </button>
                {restaurant.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-full text-left px-4 py-2 text-xs font-sans text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
          />
        </div>

        {viewingImage && restaurant.imageUrl && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setViewingImage(false)}
          >
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="max-w-full max-h-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setViewingImage(false)}
              className="absolute top-4 right-4 text-white text-sm font-sans bg-white/20 rounded-lg px-3 py-1.5 hover:bg-white/30"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Name</label>
            <input
              type="text"
              value={form.restaurantName}
              onChange={(e) => setForm((c) => ({ ...c, restaurantName: e.target.value }))}
              className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none text-sm dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">City / Branch</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
              className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none text-sm dark:text-neutral-100"
            />
          </div>
        </div>

        <div>
          <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Phone</label>
          <input
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none text-sm dark:text-neutral-100"
          />
        </div>

        <div>
          <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
            className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none text-sm dark:text-neutral-100 resize-y min-h-[80px]"
          />
        </div>

        <div>
          <label className="block font-sans text-[10px] font-medium text-neutral-400 mb-1">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm((c) => ({ ...c, country: e.target.value }))}
            className="w-full bg-white dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-neutral-400 outline-none text-sm dark:text-neutral-100"
          />
        </div>

        <div className="border-t border-[#E5E7EB] dark:border-neutral-800 pt-4 space-y-4">
          <ToggleSwitch
            checked={form.soundEnabled}
            onChange={(v) => setForm((c) => ({ ...c, soundEnabled: v }))}
            label="Sound"
            description="Play notification sound on new orders"
          />
          <ToggleSwitch
            checked={form.autoAccept}
            onChange={(v) => setForm((c) => ({ ...c, autoAccept: v }))}
            label="Auto-Accept"
            description="Automatically accept incoming orders"
          />
          <ToggleSwitch
            checked={form.active}
            onChange={(v) => setForm((c) => ({ ...c, active: v }))}
            label="Visibility"
            description="Make restaurant visible to customers"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800 font-sans text-xs font-medium rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
