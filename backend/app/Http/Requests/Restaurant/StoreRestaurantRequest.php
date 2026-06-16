<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreRestaurantRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'restaurantName' => 'required|string|max:191',
            'city' => 'nullable|string|max:191',
            'country' => 'nullable|string|max:191',
            'restaurantImage' => 'nullable|image|max:5120',
            'restaurantImagePositionX' => 'nullable|numeric|min:0|max:100',
            'restaurantImagePositionY' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
