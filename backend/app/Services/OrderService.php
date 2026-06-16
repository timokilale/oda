<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;

class OrderService
{
    public function getOrders(string $restaurantId): array
    {
        $orders = Order::where('restaurant_id', $restaurantId)
            ->with(['items.menuItem'])
            ->orderByDesc('id')
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
        return [
            'totalOrderCount' => count($orders),
            'pendingOrderCount' => count(array_filter($orders, fn($o) => $o['status'] === 'pending')),
            'confirmedOrderCount' => count(array_filter($orders, fn($o) => $o['status'] === 'confirmed')),
            'completedOrderCount' => count(array_filter($orders, fn($o) => $o['status'] === 'completed')),
            'cancelledOrderCount' => count(array_filter($orders, fn($o) => $o['status'] === 'cancelled')),
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
}
