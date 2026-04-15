import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => "blob:preview");
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
