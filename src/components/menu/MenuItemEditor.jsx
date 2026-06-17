import { useState } from "react";
import ImagePositionField from "../ImagePositionField.jsx";
import { createCroppedUpload, MENU_IMAGE_TARGET } from "../../lib/cropImage.js";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet.jsx";

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
    <Sheet open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit {editingItem.name}</SheetTitle>
          <SheetDescription>Update the item details below.</SheetDescription>
        </SheetHeader>

        <form className="flex flex-col gap-4 p-4 overflow-y-auto flex-1" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="menu_item_name">
                  Name
                </label>
                <input
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                  id="menu_item_name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="menu_item_price">
                  Price
                </label>
                <input
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                  id="menu_item_price"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 2500"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="menu_item_category">
                  Category
                </label>
                <input
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                  id="menu_item_category"
                  list="menu-category-suggestions"
                  placeholder="e.g. Drinks"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  required
                />
                <datalist id="menu-category-suggestions">
                  {categorySuggestions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="menu_item_status">
                  Status
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                  id="menu_item_status"
                  value={form.active ? "available" : "archived"}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.value === "available" }))
                  }
                >
                  <option value="available">Available</option>
                  <option value="archived">Archived (hidden permanently)</option>
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
                  className={`inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
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
                  <span className="text-xs text-muted-foreground">Will be removed when you save.</span>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="menu_item_description">
                Description
              </label>
              <textarea
                className="h-10 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors resize-y"
                id="menu_item_description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <button type="submit" className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
