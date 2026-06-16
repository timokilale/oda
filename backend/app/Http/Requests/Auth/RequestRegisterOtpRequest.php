<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RequestRegisterOtpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => 'required|string',
            'restaurantName' => 'required|string|max:191',
            'city' => 'nullable|string|max:191',
            'country' => 'nullable|string|max:191',
            'restaurantImage' => 'nullable|image|max:5120',
            'restaurantImagePositionX' => 'nullable|numeric|min:0|max:100',
            'restaurantImagePositionY' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
