<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OwnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'phoneNumber' => $this->phone_number,
            'phoneVerifiedAt' => $this->phone_verified_at,
            'isAdmin' => $this->is_admin,
            'canManageMultipleRestaurants' => $this->can_manage_multiple_restaurants,
        ];
    }
}
