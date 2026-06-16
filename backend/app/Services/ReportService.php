<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getReport(string $restaurantId, string $period = 'all'): array
    {
        $baseQuery = Order::where('restaurant_id', $restaurantId);

        $dateFilter = match ($period) {
            'today' => fn($q) => $q->whereDate('created_at', today()),
            'week' => fn($q) => $q->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]),
            'month' => fn($q) => $q->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year),
            default => null,
        };

        $totalsQuery = DB::table('orders as o')
            ->leftJoin(DB::raw('(SELECT oi.order_id, SUM(oi.quantity * mi.price) AS total_amount FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id GROUP BY oi.order_id) as order_totals'), 'order_totals.order_id', '=', 'o.id')
            ->where('o.restaurant_id', $restaurantId);

        if ($dateFilter) {
            $totalsQuery->where($dateFilter);
        }

        $totals = $totalsQuery->select([
            DB::raw('COUNT(*) AS total_orders'),
            DB::raw("SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) AS pending_orders"),
            DB::raw("SUM(CASE WHEN o.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_orders"),
            DB::raw("SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) AS completed_orders"),
            DB::raw("SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders"),
            DB::raw("SUM(CASE WHEN o.status <> 'cancelled' THEN order_totals.total_amount ELSE 0 END) AS revenue_total"),
            DB::raw("AVG(CASE WHEN o.status <> 'cancelled' THEN order_totals.total_amount END) AS average_ticket"),
            DB::raw("SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS orders_today"),
        ])->first();

        $topItemsQuery = DB::table('order_items as oi')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->join('menu_items as mi', 'mi.id', '=', 'oi.menu_item_id')
            ->where('o.restaurant_id', $restaurantId)
            ->where('o.status', '<>', 'cancelled')
            ->select([
                'mi.name',
                DB::raw('SUM(oi.quantity) AS quantity_sold'),
                DB::raw('SUM(oi.quantity * mi.price) AS revenue'),
            ])
            ->groupBy('mi.id', 'mi.name')
            ->orderByDesc('quantity_sold')
            ->orderByDesc('revenue')
            ->orderBy('mi.name')
            ->limit(5);

        if ($dateFilter) {
            $topItemsQuery->where($dateFilter);
        }

        $topItems = $topItemsQuery->get();

        $t = $totals ?? (object) [];
        $completedOrders = (int) ($t->completed_orders ?? 0);
        $activeOrders = (int) ($t->pending_orders ?? 0) + (int) ($t->confirmed_orders ?? 0) + $completedOrders;

        return [
            'totalOrders' => (int) ($t->total_orders ?? 0),
            'pendingOrders' => (int) ($t->pending_orders ?? 0),
            'confirmedOrders' => (int) ($t->confirmed_orders ?? 0),
            'completedOrders' => $completedOrders,
            'cancelledOrders' => (int) ($t->cancelled_orders ?? 0),
            'revenueTotal' => (float) ($t->revenue_total ?? 0),
            'averageTicket' => (float) ($t->average_ticket ?? 0),
            'ordersToday' => (int) ($t->orders_today ?? 0),
            'completionRate' => $activeOrders > 0 ? round(($completedOrders / $activeOrders) * 100, 2) : 0,
            'topItems' => $topItems->map(fn($item) => [
                'name' => $item->name,
                'quantitySold' => (int) ($item->quantity_sold ?? 0),
                'revenue' => (float) ($item->revenue ?? 0),
            ])->toArray(),
        ];
    }
}
