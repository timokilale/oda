<?php

return [
    'secret' => env('JWT_SECRET'),
    'algo' => 'HS256',
    'ttl' => 30 * 24 * 60, // 30 days in minutes
];
