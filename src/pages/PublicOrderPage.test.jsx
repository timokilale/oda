import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("shows the manual table lookup form when no table query is present", () => {
    renderPage("/r/demo/order");

    expect(screen.getByLabelText("Table reference")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load menu" })).toBeInTheDocument();
  });

  it("loads the menu and places an order from the cart", async () => {
    const user = userEvent.setup();
    const contextPayload = {
      restaurant: {
        id: 12,
        name: "Coast Kitchen",
      },
      tableNumber: "A1",
      menuItems: [
        {
          id: 1,
          name: "Pilau",
          description: "Signature rice.",
          price: 1200,
          category: "Main dishes",
          categoryPath: "Main dishes",
          imageUrl: null,
          imagePositionX: 50,
          imagePositionY: 50,
        },
      ],
      menuTree: [
        {
          name: "Main dishes",
          children: [],
          items: [
            {
              id: 1,
              name: "Pilau",
              description: "Signature rice.",
              price: 1200,
              category: "Main dishes",
              categoryPath: "Main dishes",
              imageUrl: null,
              imagePositionX: 50,
              imagePositionY: 50,
            },
          ],
        },
      ],
    };

    apiRequest.mockImplementation((path, options = {}) => {
      if (path === "/public/restaurants/demo/order-context?table=A1") {
        return Promise.resolve(contextPayload);
      }

      if (path === "/public/restaurants/demo/orders" && options.method === "POST") {
        return Promise.resolve({ successMessage: "Order placed successfully." });
      }

      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    renderPage("/r/demo/order?table=A1");

    expect(await screen.findByRole("heading", { name: "Coast Kitchen" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Main dishes" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Pilau" }));

    // CUS-L09: Must review cart first — button says "Review Order" initially
    const reviewButton = screen.getByRole("button", { name: "Review Order" });
    expect(reviewButton).toBeEnabled();
    await user.click(reviewButton);

    // Now the review sheet is open (role="dialog"), find the Place Order button inside it
    const reviewSheet = screen.getByRole("dialog", { name: "Your order" });
    const placeOrderButton = within(reviewSheet).getByRole("button", { name: /Place Order/ });
    expect(placeOrderButton).toBeEnabled();
    await user.click(placeOrderButton);

    expect(await screen.findByText("Order placed successfully.")).toBeInTheDocument();

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
