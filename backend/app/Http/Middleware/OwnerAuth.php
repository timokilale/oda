<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OwnerAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::guard('owner')->check()) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }

        $owner = Auth::guard('owner')->user();
        $request->setUserResolver(fn() => $owner);

        return $next($request);
    }
}
