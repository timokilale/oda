<?php

namespace App\Http\Controllers;

use App\Http\Requests\Table\StoreTableRequest;
use App\Models\Restaurant;
use App\Services\TableService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TableController extends Controller
{
    public function __construct(
        private readonly TableService $tableService,
    ) {}

    public function index(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        $tables = $this->tableService->getTables($restaurant);

        return response()->json(['tables' => $tables]);
    }

    public function store(StoreTableRequest $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $table = $this->tableService->createTable($restaurant, trim($request->input('tableNumber', '')));

        return response()->json([
            'table' => [
                'id' => $table->id,
                'tableNumber' => $table->table_number,
                'qrCodeUrl' => $table->qr_code_path,
                'qrTargetUrl' => $table->qr_target_url,
                'legacyToken' => $restaurant->id . '-' . $table->table_number,
            ],
        ], 201);
    }

    public function destroy(Request $request, string $restaurantId, string $tableId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $deleted = $this->tableService->deleteTable($tableId, $restaurantId);
        if (!$deleted) {
            return response()->json(['error' => 'Table not found.'], 404);
        }

        return response()->json(null, 204);
    }
}
