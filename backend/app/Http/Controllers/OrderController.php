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

    public function stream(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        $response = response()->stream(function () use ($restaurantId) {
            session_write_close();
            set_time_limit(0);

            if (ini_get('zlib.output_compression')) {
                ini_set('zlib.output_compression', '0');
            }

            $lastDigest = null;
            $lastHeartbeat = time();
            $first = true;
            $startTime = time();

            while (true) {
                $digest = $this->orderService->getOrdersDigest($restaurantId);
                $digestHash = md5(json_encode($digest));

                if ($first || $digestHash !== $lastDigest) {
                    $orders = $this->orderService->getOrders($restaurantId);
                    $summary = $this->orderService->getOrderSummary($orders);

                    echo "event: orders\n";
                    echo "data: " . json_encode(['orders' => $orders, 'orderSummary' => $summary]) . "\n\n";

                    $lastDigest = $digestHash;
                    $first = false;
                }

                $now = time();
                if ($now - $lastHeartbeat >= 15) {
                    echo ": heartbeat\n\n";
                    $lastHeartbeat = $now;
                }

                echo ": ping\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();

                if (connection_aborted()) {
                    break;
                }

                sleep(2);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);

        return $response;
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
