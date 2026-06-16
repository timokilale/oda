<?php

namespace App\Http\Controllers;

use App\Http\Requests\Restaurant\StoreRestaurantRequest;
use App\Http\Requests\Restaurant\UpdateRestaurantRequest;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Services\RestaurantService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RestaurantController extends Controller
{
    public function __construct(
        private readonly RestaurantService $restaurantService,
    ) {}

    public function index(Request $request)
    {
        $owner = $request->user();
        $restaurants = $this->restaurantService->getOwnerRestaurants($owner->id);

        $ownerCanAddRestaurant = count($restaurants) === 0
            || $owner->can_manage_multiple_restaurants
            || $owner->is_admin;

        return response()->json([
            'restaurants' => $restaurants,
            'ownerCanAddRestaurant' => $ownerCanAddRestaurant,
        ]);
    }

    public function store(StoreRestaurantRequest $request)
    {
        $owner = $request->user();

        if (!Gate::forUser($owner)->allows('create', Restaurant::class)) {
            return response()->json(['error' => 'Additional restaurants need admin access.'], 403);
        }

        $imagePath = null;
        if ($request->hasFile('restaurantImage')) {
            $file = $request->file('restaurantImage');
            $path = $file->store('restaurants', 'uploads');
            $imagePath = '/uploads/' . $path;
        }

        $restaurant = $this->restaurantService->createRestaurant($owner, [
            'restaurantName' => trim($request->input('restaurantName', '')),
            'city' => trim($request->input('city', '')),
            'country' => trim($request->input('country', '')),
            'imagePath' => $imagePath,
            'imagePositionX' => $request->input('restaurantImagePositionX', 50),
            'imagePositionY' => $request->input('restaurantImagePositionY', 50),
        ]);

        return response()->json(['restaurant' => new RestaurantResource($restaurant)], 201);
    }

    public function show(Request $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('view', $restaurant);

        $summary = $this->restaurantService->getWorkspaceSummary($restaurantId);

        return response()->json([
            'restaurant' => new RestaurantResource($restaurant),
            'workspaceSummary' => $summary,
        ]);
    }

    public function update(UpdateRestaurantRequest $request, string $restaurantId)
    {
        $owner = $request->user();
        $restaurant = Restaurant::findOrFail($restaurantId);
        Gate::forUser($owner)->authorize('update', $restaurant);

        $data = [
            'name' => trim($request->input('restaurantName', $request->input('name', $restaurant->name))),
            'address' => trim($request->input('address', $restaurant->address ?? '')),
            'city' => trim($request->input('city', $restaurant->city ?? '')),
            'country' => trim($request->input('country', $restaurant->country ?? '')),
        ];

        $phoneInput = $request->input('phone');
        $data['phone'] = $phoneInput === null
            ? $restaurant->phone
            : (preg_replace('/[^\d]/', '', $phoneInput) ? '+' . preg_replace('/[^\d]/', '', $phoneInput) : null);

        $activeInput = $request->input('active', $restaurant->active);
        $data['active'] = is_bool($activeInput)
            ? $activeInput
            : in_array(strtolower((string) $activeInput), ['true', '1', 'yes', 'active']);

        $removeImage = strtolower(trim($request->input('removeImage', ''))) === 'true';

        if ($request->hasFile('restaurantImage')) {
            $file = $request->file('restaurantImage');
            $path = $file->store('restaurants', 'uploads');
            $data['imagePath'] = '/uploads/' . $path;
        } elseif ($removeImage) {
            $data['imagePath'] = null;
        }

        $data['imagePositionX'] = $request->input('restaurantImagePositionX', $request->input('imagePositionX', $restaurant->image_position_x ?? 50));
        $data['imagePositionY'] = $request->input('restaurantImagePositionY', $request->input('imagePositionY', $restaurant->image_position_y ?? 50));

        $updated = $this->restaurantService->updateRestaurant($restaurant, $data);
        $summary = $this->restaurantService->getWorkspaceSummary($restaurantId);

        return response()->json([
            'restaurant' => new RestaurantResource($updated),
            'workspaceSummary' => $summary,
        ]);
    }
}
