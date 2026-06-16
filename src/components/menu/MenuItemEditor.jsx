import { useState } from "react";
import ImagePositionField from "../ImagePositionField.jsx";
import { createCroppedUpload, MENU_IMAGE_TARGET } from "../../lib/cropImage.js";

function buildEmptyForm(defaultCategory = "") {
  return {
    name: "",
    price: "",
    category: defaultCategory,
    description: "",
    image: null,
    previewUrl: "",
    removeImage: false,
    imagePositionX: 50,
    imagePositionY: 50,
    active: true,
  };
}

function buildFormFromItem(item) {
  return {
    name: item.name || "",
    price: String(item.price ?? ""),
    category: item.category || "",
    description: item.description || "",
    image: null,
    previewUrl: item.imageUrl || "",
    removeImage: false,
    imagePositionX: item.imagePositionX ?? 50,
    imagePositionY: item.imagePositionY ?? 50,
    active: Boolean(item.active),
  };
}

export { buildEmptyForm, buildFormFromItem };

export default function MenuItemEditor({
  editingItem,
  categorySuggestions,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(buildFormFromItem(editingItem));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("price", form.price);
    formData.set("category", form.category);
    formData.set("description", form.description);
    formData.set("active", String(form.active));
    formData.set("removeImage", String(form.removeImage));
    formData.set("imagePositionX", String(form.imagePositionX));
    formData.set("imagePositionY", String(form.imagePositionY));

    if (form.image) {
      const croppedImage = await createCroppedUpload(form.image, {
        ...MENU_IMAGE_TARGET,
        positionX: form.imagePositionX,
        positionY: form.imagePositionY,
      });
      formData.set("image", croppedImage);
    }

    try {
      await onSave(editingItem.id, formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[1.42rem] font-display italic text-foreground">Edit menu item</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Update details here. New items belong in the dedicated add-items flow.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          onClick={onCancel}
          disabled={submitting}
        >
          Close editor
        </button>
      </div>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="menu_item_name">
              Name
            </label>
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="menu_item_name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="menu_item_price">
              Price
            </label>
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="menu_item_price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="menu_item_category">
              Category
            </label>
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="menu_item_category"
              list="menu-category-suggestions"
              placeholder="e.g. Drinks or Drinks > Hot Drinks"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">Use " &gt; " to create sub-categories visible to customers.</p>
            <datalist id="menu-category-suggestions">
              {categorySuggestions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="menu_item_status">
              Availability
            </label>
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground transition-colors"
              id="menu_item_status"
              value={String(form.active)}
              onChange={(event) =>
                setForm((current) => ({ ...current, active: event.target.value === "true" }))
              }
            >
              <option value="true">Active</option>
              <option value="false">Archived</option>
            </select>
          </div>
        </div>

        <ImagePositionField
          inputId="menu_item_image"
          label="Image"
          file={form.image}
          previewUrl={form.image ? "" : form.removeImage ? "" : form.previewUrl}
          positionX={form.imagePositionX}
          positionY={form.imagePositionY}
          aspectRatio={MENU_IMAGE_TARGET.aspectRatio}
          disabled={submitting}
          onFileChange={(file) =>
            setForm((current) => ({
              ...current,
              image: file,
              removeImage: false,
              imagePositionX: file ? 50 : current.imagePositionX,
              imagePositionY: file ? 50 : current.imagePositionY,
            }))
          }
          onPositionChange={({ x, y }) =>
            setForm((current) => ({
              ...current,
              imagePositionX: x,
              imagePositionY: y,
            }))
          }
        />

        {(form.previewUrl || form.image) ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                form.removeImage
                  ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  removeImage: !current.removeImage,
                  image: null,
                }))
              }
              disabled={submitting}
            >
              {form.removeImage ? "Keep image" : "Remove image"}
            </button>
            {form.removeImage ? (
              <span className="text-xs text-muted-foreground">The current image will be removed when you save.</span>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono" htmlFor="menu_item_description">
            Description
          </label>
          <textarea
            className="h-8 min-h-[80px] w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground transition-colors resize-y"
            id="menu_item_description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button type="submit" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={submitting}>
            {submitting ? "Saving" : "Save item"}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
