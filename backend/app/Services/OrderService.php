<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderService
{
    private const MAX_ORDERS = 100;

    public function getOrders(string $restaurantId): array
    {
        $orders = Order::where('restaurant_id', $restaurantId)
            ->with(['items.menuItem'])
            ->orderByDesc('id')
            ->take(self::MAX_ORDERS)
            ->get();

        return $orders->map(function ($order) {
            $totalAmount = $order->items->sum(fn($item) => $item->quantity * $item->menuItem->price);

            $itemsSummary = $order->items
                ->sortBy('menuItem.name')
                ->map(fn($item) => $item->quantity . 'x ' . $item->menuItem->name)
                ->implode(', ');

            return [
                'id' => $order->id,
                'tableNumber' => $order->table_number,
                'status' => $order->status,
                'createdAt' => $order->created_at,
                'totalAmount' => (float) $totalAmount,
                'itemsSummary' => $itemsSummary,
            ];
        })->toArray();
    }

    public function getOrderSummary(array $orders): array
    {
        $pending = 0;
        $confirmed = 0;
        $completed = 0;
        $cancelled = 0;
        foreach ($orders as $o) {
            match ($o['status']) {
                'pending' => $pending++,
                'confirmed' => $confirmed++,
                'completed' => $completed++,
                'cancelled' => $cancelled++,
                default => null,
            };
        }
        return [
            'totalOrderCount' => count($orders),
            'pendingOrderCount' => $pending,
            'confirmedOrderCount' => $confirmed,
            'completedOrderCount' => $completed,
            'cancelledOrderCount' => $cancelled,
        ];
    }

    public function findOrder(string $orderId, string $restaurantId): ?Order
    {
        return Order::where('id', $orderId)->where('restaurant_id', $restaurantId)->first();
    }

    public function transitionStatus(Order $order, OrderStatus $nextStatus): string
    {
        $currentStatus = OrderStatus::from($order->status);
        if ($currentStatus === $nextStatus) {
            return $nextStatus->value;
        }

        $allowed = $currentStatus->allowedTransitions();
        if (!in_array($nextStatus, $allowed)) {
            abort(409, "Cannot change an order from {$currentStatus->value} to {$nextStatus->value}.");
        }

        $order->update(['status' => $nextStatus->value]);
        return $nextStatus->value;
    }

    public function getOrdersDigest(string $restaurantId): array
    {
        $rows = DB::table('orders')
            ->select('id', 'status', 'created_at')
            ->where('restaurant_id', $restaurantId)
            ->orderByDesc('id')
            ->take(self::MAX_ORDERS)
            ->get()
            ->toArray();
        return $rows;
    }
}
