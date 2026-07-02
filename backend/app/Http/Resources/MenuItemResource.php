<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $badges = $this->badges ? array_map('trim', explode(',', $this->badges)) : [];

        return [
            'id' => $this->id,
            'restaurantId' => $this->restaurant_id,
            'name' => $this->name,
            'description' => $this->description,
            'ingredients' => $this->ingredients,
            'price' => (float) $this->price,
            'calories' => $this->calories,
            'prepTime' => $this->prep_time,
            'spiciness' => $this->spiciness,
            'badges' => $badges,
            'category' => $this->category,
            'active' => (bool) $this->active,
            'imageUrl' => $this->image_path,
            'imagePositionX' => (float) ($this->image_position_x ?? 50),
            'imagePositionY' => (float) ($this->image_position_y ?? 50),
        ];
    }
}
