<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RequestChangePhoneOtpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'newPhoneNumber' => 'required|string',
        ];
    }
}
