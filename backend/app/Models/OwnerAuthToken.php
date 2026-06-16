<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerAuthToken extends Model
{
    public $timestamps = false;

    protected $table = 'owner_auth_tokens';

    protected $fillable = [
        'owner_id',
        'token_hash',
        'user_agent',
        'expires_at',
        'revoked_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(Owner::class, 'owner_id');
    }
}
