<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Models\Restaurant;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function index(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        $orders = $this->orderService->getOrders($restaurantId);
        $summary = $this->orderService->getOrderSummary($orders);

        return response()->json(['orders' => $orders, 'orderSummary' => $summary]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, string $restaurantId, string $orderId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $order = $this->orderService->findOrder($orderId, $restaurantId);
        if (!$order) {
            return response()->json(['error' => 'Order not found.'], 404);
        }

        $nextStatus = OrderStatus::from($request->input('status'));
        $newStatus = $this->orderService->transitionStatus($order, $nextStatus);

        return response()->json(['status' => $newStatus]);
    }
}
