<?php

namespace App\Http\Controllers;

use App\Http\Requests\MenuItem\StoreMenuItemRequest;
use App\Http\Requests\MenuItem\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Services\MenuItemService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MenuItemController extends Controller
{
    public function __construct(
        private readonly MenuItemService $menuItemService,
    ) {}

    public function index(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        return response()->json([
            'categorySuggestions' => $this->menuItemService->getCategorySuggestions($restaurantId),
            'items' => $this->menuItemService->getMenuItems($restaurantId),
        ]);
    }

    public function store(StoreMenuItemRequest $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('menu-items', 'uploads');
            $imagePath = '/uploads/' . $path;
        }

        $item = $this->menuItemService->createMenuItem($restaurantId, [
            'name' => trim($request->input('name', '')),
            'price' => $request->input('price'),
            'category' => trim($request->input('category', '')),
            'description' => trim($request->input('description', '')),
            'imagePath' => $imagePath,
            'imagePositionX' => $request->input('imagePositionX', 50),
            'imagePositionY' => $request->input('imagePositionY', 50),
        ]);

        return response()->json(['item' => new MenuItemResource($item)], 201);
    }

    public function update(UpdateMenuItemRequest $request, string $restaurantId, string $itemId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $item = MenuItem::where('id', $itemId)->where('restaurant_id', $restaurantId)->firstOrFail();

        $data = [
            'name' => trim($request->input('name', $item->name)),
            'price' => $request->input('price', $item->price),
            'category' => trim($request->input('category', $item->category)),
            'description' => trim($request->input('description', $item->description ?? '')),
        ];

        $activeInput = $request->input('active', $item->active);
        $data['active'] = is_bool($activeInput)
            ? $activeInput
            : in_array(strtolower((string) $activeInput), ['true', '1', 'yes', 'active']);

        $removeImage = strtolower(trim($request->input('removeImage', ''))) === 'true';

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('menu-items', 'uploads');
            $data['imagePath'] = '/uploads/' . $path;
        } elseif ($removeImage) {
            $data['imagePath'] = null;
        }

        $data['imagePositionX'] = $request->input('imagePositionX', $item->image_position_x ?? 50);
        $data['imagePositionY'] = $request->input('imagePositionY', $item->image_position_y ?? 50);

        $updated = $this->menuItemService->updateMenuItem($item, $data);

        return response()->json(['item' => new MenuItemResource($updated)]);
    }

    public function destroy(Request $request, string $restaurantId, string $itemId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $item = MenuItem::where('id', $itemId)->where('restaurant_id', $restaurantId)->where('active', 1)->firstOrFail();
        $this->menuItemService->deleteMenuItem($item);

        return response()->json(null, 204);
    }
}
