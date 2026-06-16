<?php

namespace App\Http\Controllers;

use App\Services\PublicService;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function __construct(
        private readonly PublicService $publicService,
    ) {}

    public function orderContext(Request $request, string $ref)
    {
        $tableRef = trim($request->input('table', ''));
        if (!$tableRef) {
            return response()->json(['error' => 'Table is required.'], 400);
        }

        return response()->json(
            $this->publicService->getOrderContext($ref, $tableRef)
        );
    }

    public function placeOrder(Request $request, string $ref)
    {
        $tableRef = trim($request->input('tableNumber', ''));
        $submittedItems = $request->input('items', []);

        if (!$tableRef) {
            return response()->json(['error' => 'Missing table number.'], 400);
        }

        $order = $this->publicService->placeOrder($ref, $tableRef, $submittedItems);

        return response()->json([
            'orderId' => $order['id'],
            'tableNumber' => $order['tableNumber'],
            'status' => 'pending',
            'successMessage' => 'Order placed successfully.',
        ], 201);
    }
}
