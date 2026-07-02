<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    public $timestamps = false;

    protected $table = 'menu_items';

    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'ingredients',
        'price',
        'calories',
        'prep_time',
        'spiciness',
        'badges',
        'category',
        'active',
        'image_path',
        'image_position_x',
        'image_position_y',
    ];

    protected $casts = [
        'active' => 'boolean',
        'price' => 'float',
        'calories' => 'integer',
        'prep_time' => 'integer',
        'spiciness' => 'integer',
        'image_position_x' => 'float',
        'image_position_y' => 'float',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class, 'restaurant_id');
    }
}
