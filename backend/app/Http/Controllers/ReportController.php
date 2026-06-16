<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    public function show(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        $period = $request->input('period', 'all');
        $reports = $this->reportService->getReport($restaurantId, $period);

        return response()->json(['reports' => $reports]);
    }
}
