<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    public $timestamps = false;

    protected $table = 'restaurants';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'public_slug',
        'address',
        'city',
        'country',
        'phone',
        'active',
        'image_path',
        'image_position_x',
        'image_position_y',
    ];

    protected $casts = [
        'active' => 'boolean',
        'image_position_x' => 'float',
        'image_position_y' => 'float',
    ];

    public function owners()
    {
        return $this->belongsToMany(Owner::class, 'owner_restaurants', 'restaurant_id', 'owner_id');
    }

    public function menuItems()
    {
        return $this->hasMany(MenuItem::class, 'restaurant_id');
    }

    public function tables()
    {
        return $this->hasMany(RestaurantTable::class, 'restaurant_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'restaurant_id');
    }

    public function getImageUrlAttribute()
    {
        return $this->image_path;
    }
}
