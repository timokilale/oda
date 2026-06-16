<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\RequestLoginOtpRequest;
use App\Http\Requests\Auth\RequestRegisterOtpRequest;
use App\Http\Requests\Auth\VerifyLoginOtpRequest;
use App\Http\Requests\Auth\VerifyRegisterOtpRequest;
use App\Http\Resources\OwnerResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function me(Request $request)
    {
        return response()->json(['owner' => new OwnerResource($request->user())]);
    }

    public function requestRegisterOtp(RequestRegisterOtpRequest $request)
    {
        $result = $this->authService->handleRegisterOtp($request);

        $payload = ['message' => 'OTP generated for registration.'];
        if (config('app.env') !== 'production' && config('app.debug')) {
            $payload['devOtpCode'] = $result['otpCode'];
        }

        return response()->json($payload, 202);
    }

    public function verifyRegisterOtp(VerifyRegisterOtpRequest $request)
    {
        $result = $this->authService->verifyRegisterOtp(
            $this->authService->normalizePhoneNumber($request->input('phoneNumber')),
            trim($request->input('otpCode', '')),
            $request->userAgent(),
        );

        $response = response()->json(['owner' => new OwnerResource($result['owner'])]);
        $this->authService->setAuthCookie($response, $result['token']['raw'], $result['token']['expires_at']);

        return $response;
    }

    public function requestLoginOtp(RequestLoginOtpRequest $request)
    {
        $result = $this->authService->handleLoginOtp($request);

        $message = $result['owner']
            ? 'OTP generated for login.'
            : 'If the phone number is registered, an OTP has been generated.';

        $payload = ['message' => $message];
        if (config('app.env') !== 'production' && config('app.debug') && $result['otpCode']) {
            $payload['devOtpCode'] = $result['otpCode'];
        }

        return response()->json($payload, 202);
    }

    public function verifyLoginOtp(VerifyLoginOtpRequest $request)
    {
        $result = $this->authService->verifyLoginOtp(
            $this->authService->normalizePhoneNumber($request->input('phoneNumber')),
            trim($request->input('otpCode', '')),
            $request->userAgent(),
        );

        $response = response()->json(['owner' => new OwnerResource($result['owner'])]);
        $this->authService->setAuthCookie($response, $result['token']['raw'], $result['token']['expires_at']);

        return $response;
    }

    public function logout(Request $request)
    {
        $rawToken = $request->cookie('oda_owner_token') ?: $request->bearerToken();
        $this->authService->revokeToken($rawToken);

        $response = response()->json(null, 204);
        $this->authService->clearAuthCookie($response);
        return $response;
    }
}
