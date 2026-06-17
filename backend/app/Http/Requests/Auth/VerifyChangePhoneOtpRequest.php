<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyChangePhoneOtpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'newPhoneNumber' => 'required|string',
            'otpCode' => 'required|string|size:6',
        ];
    }
}
