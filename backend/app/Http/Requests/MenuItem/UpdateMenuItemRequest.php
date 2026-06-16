<?php

namespace App\Http\Requests\MenuItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'nullable|string|max:191',
            'price' => 'nullable|regex:/^\d+(\.\d{1,2})?$/|numeric|min:0|max:1000000',
            'category' => 'nullable|string|max:191',
            'description' => 'nullable|string',
            'active' => 'nullable|boolean',
            'removeImage' => 'nullable|boolean',
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
