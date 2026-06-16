<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $owner = $request->user();
        if (!$owner) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }

        if (!$owner->is_admin) {
            return response()->json(['error' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}
