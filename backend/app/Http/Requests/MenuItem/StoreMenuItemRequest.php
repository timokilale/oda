<?php

namespace App\Http\Requests\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:191',
            'price' => 'required|regex:/^\d+(\.\d{1,2})?$/|numeric|min:0|max:1000000',
            'category' => 'required|string|max:191',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'imagePositionX' => 'nullable|numeric|min:0|max:100',
            'imagePositionY' => 'nullable|numeric|min:0|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'price.regex' => 'Price must be a valid amount with up to 2 decimal places.',
        ];
    }
}
