<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRestaurantRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'nullable|string|max:191',
            'restaurantName' => 'nullable|string|max:191',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:191',
            'country' => 'nullable|string|max:191',
            'phone' => 'nullable|string|max:80',
            'active' => 'nullable|boolean',
            'removeImage' => 'nullable|boolean',
            'restaurantImage' => 'nullable|image|max:5120',
            'restaurantImagePositionX' => 'nullable|numeric|min:0|max:100',
            'restaurantImagePositionY' => 'nullable|numeric|min:0|max:100',
            'menuWrapperUrl' => 'nullable|string|max:500',
        ];
    }
}
