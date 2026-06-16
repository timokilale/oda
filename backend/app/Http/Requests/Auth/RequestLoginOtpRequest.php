<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RequestLoginOtpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => 'required|string',
        ];
    }
}
