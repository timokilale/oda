<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/uploads/{path}', function (string $path) {
    $root = realpath(config('filesystems.disks.uploads.root'));
    $file = realpath($root . '/' . $path);
    if ($file === false || !str_starts_with($file, $root)) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response()->file($file);
})->where('path', '.*');

Route::get('/assets/{path}', function (string $path) {
    $root = realpath(config('filesystems.disks.uploads.root'));
    $file = realpath($root . '/' . $path);
    if ($file === false || !str_starts_with($file, $root)) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response()->file($file);
})->where('path', '.*');
