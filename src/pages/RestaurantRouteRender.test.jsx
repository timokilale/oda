import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

describe("restaurant route rendering", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("renders the orders workspace route", async () => {
    window.history.pushState({}, "", "/restaurants/restaurant-2/orders");

    vi.stubGlobal(
      "fetch",
      vi.fn((input, init) => {
        const url = String(input);
        const signal = init?.signal;

        if (url.endsWith("/api/auth/me")) {
          return Promise.resolve(
            jsonResponse({
              owner: {
                id: "owner-1",
                phoneNumber: "+254700000001",
                isAdmin: false,
                canManageMultipleRestaurants: true,
              },
            }),
          );
        }

        if (url.endsWith("/api/restaurants/restaurant-2/orders")) {
          return Promise.resolve(
            jsonResponse({
              orders: [],
              orderSummary: {
                totalOrderCount: 0,
                pendingOrderCount: 0,
                confirmedOrderCount: 0,
                completedOrderCount: 0,
                cancelledOrderCount: 0,
              },
            }),
          );
        }

        if (url.endsWith("/api/restaurants/restaurant-2")) {
          return new Promise((resolve, reject) => {
            const timer = window.setTimeout(() => {
              resolve(
                jsonResponse({
                  restaurant: {
                    id: "restaurant-2",
                    name: "Test Kitchen",
                    active: true,
                  },
                  workspaceSummary: {
                    menuItemCount: 0,
                    tableCount: 0,
                    totalOrderCount: 0,
                    openOrderCount: 0,
                  },
                }),
              );
            }, 10);

            signal?.addEventListener(
              "abort",
              () => {
                window.clearTimeout(timer);
                reject(new DOMException("Aborted", "AbortError"));
              },
              { once: true },
            );
          });
        }

        if (url.endsWith("/api/restaurants")) {
          return Promise.resolve(
            jsonResponse({
              restaurants: [
                {
                  id: "restaurant-2",
                  name: "Test Kitchen",
                  active: true,
                  menuItemCount: 0,
                  tableCount: 0,
                  openOrderCount: 0,
                },
              ],
              ownerCanAddRestaurant: true,
            }),
          );
        }

        throw new Error(`Unhandled fetch: ${url}`);
      }),
    );

    render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
    });

    expect(screen.getByRole("tablist", { name: "Test Kitchen sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "restaurant-tab-orders");
    expect(screen.getByText("Test Kitchen")).toBeInTheDocument();
  });
});
