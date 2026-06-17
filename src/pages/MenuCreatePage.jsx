import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

function quickDraft() {
  return { name: "", price: "", category: "", description: "" };
}

export default function MenuCreatePage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const navigate = useNavigate();
  const [mode, setMode] = useState("single");

  const [single, setSingle] = useState(quickDraft());
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [file, setFile] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [singleCategory, setSingleCategory] = useState("");

  usePageTitle(`Add items - ${restaurant.name}`);

  useEffect(() => {
    let active = true;
    async function loadSuggestions() {
      try {
        const data = await apiRequest(`/restaurants/${restaurant.id}/menu-items`);
        if (active) {
          setCategorySuggestions(data.categorySuggestions || []);
          if (data.categorySuggestions?.length) {
            setSingleCategory(data.categorySuggestions[0]);
          }
        }
      } catch { /* ignore */ }
    }
    loadSuggestions();
    return () => { active = false; };
  }, [restaurant.id]);

  async function handleSingleSubmit(event) {
    event.preventDefault();
    clearFlash();
    if (!single.name.trim() || !single.price.trim()) {
      setFlash({ type: "error", message: "Name and price are required." });
      return;
    }
    setSingleSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", single.name.trim());
      formData.set("price", single.price.trim().replace(/[^\d.]/g, ""));
      formData.set("category", single.category || singleCategory || "Uncategorized");
      formData.set("description", single.description);
      formData.set("active", "true");
      formData.set("removeImage", "false");
      formData.set("imagePositionX", "50");
      formData.set("imagePositionY", "50");

      await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
        method: "POST",
        formData,
      });
      refreshWorkspace().catch(() => undefined);
      navigate(`/restaurants/${restaurant.id}/menu`, {
        replace: true,
        state: { flash: { type: "success", message: "Item added." } },
      });
    } catch (error) {
      setFlash({ type: "error", message: error.message });
      setSingleSubmitting(false);
    }
  }

  function handleFile(event) {
    const f = event.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (json.length > 0) {
        setColumns(Object.keys(json[0]));
        setRows(json);
      }
    };
    reader.readAsArrayBuffer(f);
  }

  function findCol(matcher) {
    return columns.find((c) => matcher.test(String(c).toLowerCase()));
  }

  const nameCol = findCol(/name|item|dish|menu/);
  const priceCol = findCol(/price|cost|amount/);
  const catCol = findCol(/cat|type|group/);
  const descCol = findCol(/desc|details|notes/);

  async function handleBulkSubmit() {
    clearFlash();
    if (!rows.length) {
      setFlash({ type: "error", message: "No data found in the file." });
      return;
    }
    if (!nameCol || !priceCol) {
      setFlash({ type: "error", message: "Could not find Name and Price columns." });
      return;
    }
    setBulkSubmitting(true);
    let created = 0;
    let errors = [];

    for (const [index, row] of rows.entries()) {
      const name = String(row[nameCol] || "").trim();
      const price = String(row[priceCol] || "").replace(/[^\d.]/g, "");
      const category = catCol ? String(row[catCol] || "").trim() : "";
      const description = descCol ? String(row[descCol] || "").trim() : "";
      if (!name || !price) {
        errors.push(`Row ${index + 2}: missing name or price`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("price", price);
        formData.set("category", category || "Uncategorized");
        formData.set("description", description);
        formData.set("active", "true");
        formData.set("removeImage", "false");
        formData.set("imagePositionX", "50");
        formData.set("imagePositionY", "50");
        await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
          method: "POST",
          formData,
        });
        created++;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    setBulkSubmitting(false);
    if (created) {
      refreshWorkspace().catch(() => undefined);
      navigate(`/restaurants/${restaurant.id}/menu`, {
        replace: true,
        state: { flash: { type: "success", message: `Added ${created} item${created === 1 ? "" : "s"}.` } },
      });
      return;
    }
    setFlash({ type: "error", message: errors[0] || "No items could be added." });
  }

  function handleClear() {
    setFile(null);
    setRows([]);
    setColumns([]);
  }

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            Add items
          </h1>
        </div>
        <Link
          to={`/restaurants/${restaurant.id}/menu`}
          className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors no-underline shrink-0 mt-6"
        >
          Back to menu
        </Link>
      </section>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1 w-fit mb-6">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`inline-flex items-center justify-center h-8 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === "single" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Single item
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`inline-flex items-center justify-center h-8 px-3 rounded-md text-sm font-medium transition-colors ${
            mode === "bulk" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bulk upload
        </button>
      </div>

      {mode === "single" ? (
        <section className="rounded-xl border border-border bg-card p-5 max-w-lg">
          <form className="grid gap-3" onSubmit={handleSingleSubmit}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="item_name">Name</label>
              <input
                id="item_name"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                type="text"
                value={single.name}
                onChange={(e) => setSingle((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="item_price">Price</label>
              <input
                id="item_price"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                type="text"
                inputMode="decimal"
                value={single.price}
                onChange={(e) => setSingle((p) => ({ ...p, price: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="item_category">Category</label>
              <select
                id="item_category"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                value={single.category || singleCategory}
                onChange={(e) => setSingle((p) => ({ ...p, category: e.target.value }))}
              >
                {(categorySuggestions.length ? categorySuggestions : ["Uncategorized"]).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="item_desc">Description</label>
              <textarea
                id="item_desc"
                className="h-10 min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y"
                value={single.description}
                onChange={(e) => setSingle((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={singleSubmitting}
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 w-fit"
            >
              {singleSubmitting ? "Adding..." : "Add item"}
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 mb-6">
          {!rows.length ? (
            <div className="text-center py-10">
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-muted-foreground/50">
                    <path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Upload an Excel file</p>
                  <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls with Name and Price columns</p>
                </div>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
              </label>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{rows.length} item{rows.length === 1 ? "" : "s"} found</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{file?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleClear} className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors">
                    Choose another file
                  </button>
                  <button type="button" onClick={handleBulkSubmit} disabled={bulkSubmitting} className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {bulkSubmitting ? "Adding items..." : `Add ${rows.length} item${rows.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {columns.map((col) => (
                        <th key={col} className="text-left text-xs font-medium text-muted-foreground py-2 pr-4 whitespace-nowrap">
                          {col}{col === nameCol ? <span className="ml-1 text-primary">*</span> : null}{col === priceCol ? <span className="ml-1 text-primary">*</span> : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        {columns.map((col) => (
                          <td key={col} className="py-1.5 pr-4 text-foreground truncate max-w-[200px]">{String(row[col] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 ? <p className="text-xs text-muted-foreground mt-2">Showing first 50 of {rows.length} rows.</p> : null}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
