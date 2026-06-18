import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../lib/api.js";
import PublicOrderPage from "./PublicOrderPage.jsx";

vi.mock("../lib/api.js", () => ({
  apiRequest: vi.fn(),
}));

function renderPage(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/r/:restaurantRef/order" element={<PublicOrderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicOrderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a message when no table query is present", () => {
    renderPage("/r/demo/order");

    expect(screen.getByText("No table specified.")).toBeInTheDocument();
  });

  it("loads the menu and places an order from the cart", async () => {
    const user = userEvent.setup();
    const contextPayload = {
      restaurant: { id: 12, name: "Coast Kitchen" },
      tableNumber: "A1",
      menuItems: [
        {
          id: 1,
          name: "Pilau",
          description: "Signature rice.",
          price: 1200,
          category: "Main dishes",
          imageUrl: null,
          imagePositionX: 50,
          imagePositionY: 50,
        },
      ],
    };

    apiRequest.mockImplementation((path, options = {}) => {
      if (path === "/public/restaurants/demo/order-context?table=A1") {
        return Promise.resolve(contextPayload);
      }

      if (path === "/public/restaurants/demo/orders?table=A1") {
        return Promise.resolve({ orders: [] });
      }

      if (path === "/public/restaurants/demo/orders" && options.method === "POST") {
        return Promise.resolve({ successMessage: "Order placed successfully." });
      }

      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    renderPage("/r/demo/order?table=A1");

    expect(await screen.findByText("Coast Kitchen")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: "Add to Order" });
    await user.click(addBtn);

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.getByText("Pilau")).toBeInTheDocument();

    const placeOrderBtn = screen.getByRole("button", { name: /Place Order/ });
    await user.click(placeOrderBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        "/public/restaurants/demo/orders",
        {
          method: "POST",
          body: {
            tableNumber: "A1",
            items: [{ id: 1, quantity: 1 }],
          },
        },
      );
    });
  });
});
