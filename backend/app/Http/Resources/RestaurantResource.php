<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'city' => $this->city,
            'country' => $this->country,
            'address' => $this->address,
            'phone' => $this->phone,
            'active' => (bool) $this->active,
            'publicSlug' => $this->public_slug,
            'imageUrl' => $this->image_path,
            'imagePositionX' => (float) ($this->image_position_x ?? 50),
            'imagePositionY' => (float) ($this->image_position_y ?? 50),
            'menuItemCount' => (int) ($this->menu_item_count ?? 0),
            'tableCount' => (int) ($this->table_count ?? 0),
            'orderCount' => (int) ($this->order_count ?? 0),
            'openOrderCount' => (int) ($this->open_order_count ?? 0),
            'menuWrapperUrl' => $this->menu_wrapper_url,
        ];
    }
}
