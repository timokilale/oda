import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuickCreateRestaurant from "./QuickCreateRestaurant.jsx";
import { apiRequest } from "../lib/api.js";
import { createCroppedUpload } from "../lib/cropImage.js";

vi.mock("../lib/api.js", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../lib/cropImage.js", () => ({
  RESTAURANT_IMAGE_TARGET: { aspectRatio: 16 / 9 },
  createCroppedUpload: vi.fn(),
}));

describe("QuickCreateRestaurant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the quick-create form and forwards the created restaurant", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    apiRequest.mockResolvedValue({
      restaurant: { id: 9, name: "Dockside Grill" },
    });

    render(<QuickCreateRestaurant onCreated={onCreated} />);

    await user.type(screen.getByPlaceholderText("Restaurant"), "Dockside Grill");
    await user.type(screen.getByPlaceholderText("City"), "Mombasa");
    await user.type(screen.getByPlaceholderText("Country"), "Kenya");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/restaurants",
        expect.objectContaining({
          method: "POST",
          formData: expect.any(FormData),
        }),
      );
    });

    const [, requestOptions] = apiRequest.mock.calls[0];
    expect(requestOptions.formData.get("restaurantName")).toBe("Dockside Grill");
    expect(requestOptions.formData.get("city")).toBe("Mombasa");
    expect(requestOptions.formData.get("country")).toBe("Kenya");
    expect(createCroppedUpload).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: 9, name: "Dockside Grill" });
    });

    expect(screen.getByPlaceholderText("Restaurant")).toHaveValue("");
  });

  it("shows backend errors instead of swallowing them", async () => {
    const user = userEvent.setup();

    apiRequest.mockRejectedValue(new Error("Restaurant name is required."));

    render(<QuickCreateRestaurant />);

    await user.type(screen.getByPlaceholderText("Restaurant"), " ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Restaurant name is required.")).toBeInTheDocument();
  });
});
