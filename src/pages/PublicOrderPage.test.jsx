import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as publicOrderService from "../services/publicOrderService";
import PublicOrderPage from "./PublicOrderPage.jsx";

vi.mock("../services/publicOrderService", () => ({
  getOrderContext: vi.fn(),
  getOrders: vi.fn(),
  createOrder: vi.fn(),
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

    publicOrderService.getOrderContext.mockResolvedValue(contextPayload);
    publicOrderService.getOrders.mockResolvedValue({ orders: [] });
    publicOrderService.createOrder.mockResolvedValue({ successMessage: "Order placed successfully." });

    renderPage("/r/demo/order?table=A1");

    expect(await screen.findByText("Coast Kitchen")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: "Add to Order" });
    await user.click(addBtn);

    await user.click(screen.getByRole("button", { name: /status/i }));

    expect(screen.getByText("Pilau")).toBeInTheDocument();

    const placeOrderBtn = screen.getByRole("button", { name: /Place Order/ });
    await user.click(placeOrderBtn);

    await waitFor(() => {
      expect(publicOrderService.createOrder).toHaveBeenCalledWith(
        "demo",
        "A1",
        [{ id: 1, quantity: 1 }],
      );
    });
  });
});
