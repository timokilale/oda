<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerAuthOtp extends Model
{
    public $timestamps = false;

    protected $table = 'owner_auth_otps';

    protected $fillable = [
        'phone_number',
        'purpose',
        'request_ip',
        'user_agent',
        'code_hash',
        'expires_at',
        'consumed_at',
        'attempt_count',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];
}
