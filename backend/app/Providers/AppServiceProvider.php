<?php

namespace App\Providers;

use App\Auth\OwnerGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Auth::extend('owner-token', function ($app, $name, array $config) {
            return new OwnerGuard();
        });
    }
}
