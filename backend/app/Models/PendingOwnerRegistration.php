<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingOwnerRegistration extends Model
{
    public $timestamps = false;

    protected $table = 'pending_owner_registrations';

    protected $primaryKey = 'phone_number';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'phone_number',
        'restaurant_name',
        'city',
        'country',
        'image_path',
        'image_position_x',
        'image_position_y',
    ];
}
