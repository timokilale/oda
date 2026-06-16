<?php

namespace App\Policies;

use App\Models\Owner;
use App\Models\Restaurant;
use Illuminate\Support\Facades\DB;

class RestaurantPolicy
{
    public function viewAny(Owner $owner): bool
    {
        return true;
    }

    public function view(Owner $owner, Restaurant $restaurant): bool
    {
        return $this->hasAccess($owner, $restaurant->id);
    }

    public function create(Owner $owner): bool
    {
        if ($owner->is_admin || $owner->can_manage_multiple_restaurants) {
            return true;
        }

        return DB::table('owner_restaurants')->where('owner_id', $owner->id)->count() === 0;
    }

    public function update(Owner $owner, Restaurant $restaurant): bool
    {
        return $this->hasAccess($owner, $restaurant->id);
    }

    public function delete(Owner $owner, Restaurant $restaurant): bool
    {
        return $this->hasAccess($owner, $restaurant->id);
    }

    private function hasAccess(Owner $owner, string $restaurantId): bool
    {
        return DB::table('owner_restaurants')
            ->where('owner_id', $owner->id)
            ->where('restaurant_id', $restaurantId)
            ->exists();
    }
}
