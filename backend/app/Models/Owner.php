<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Owner extends Authenticatable
{
    use HasApiTokens;

    public $timestamps = false;

    protected $table = 'owners';

    protected $fillable = [
        'phone_number',
        'email',
        'password_hash',
        'phone_verified_at',
        'is_admin',
        'can_manage_multiple_restaurants',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'can_manage_multiple_restaurants' => 'boolean',
    ];

    public function restaurants()
    {
        return $this->belongsToMany(Restaurant::class, 'owner_restaurants', 'owner_id', 'restaurant_id');
    }

    public function tokens()
    {
        return $this->hasMany(OwnerAuthToken::class, 'owner_id');
    }
}
