<?php

namespace App\Http\Requests\Table;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'tableNumber' => 'required|string|max:120',
        ];
    }
}
