<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantTable extends Model
{
    public $timestamps = false;

    protected $table = 'restaurant_tables';

    protected $fillable = [
        'restaurant_id',
        'table_number',
        'qr_code_path',
        'qr_target_url',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class, 'restaurant_id');
    }
}
