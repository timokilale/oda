<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyRegisterOtpRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'phoneNumber' => 'required|string',
            'otpCode' => 'required|string|size:6',
        ];
    }
}
