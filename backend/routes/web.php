<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

$dist = __DIR__ . '/../public/dist';
Route::get('/uploads/{path}', function (string $path) {
    $root = config('filesystems.disks.uploads.root');
    $file = realpath($root . '/' . $path);
    if ($file === false || !str_starts_with($file, $root)) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response()->file($file);
})->where('path', '.*');

Route::get('/{path}', function (string $path) use ($dist) {
    if (str_starts_with($path, 'api/')) {
        return response()->json(['error' => 'Not found'], 404);
    }

    $file = $dist . '/' . $path;
    if (file_exists($file) && !is_dir($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'html' => 'text/html',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'ttf' => 'font/ttf',
        ];
        return response()->file($file, [
            'Content-Type' => $mimes[$ext] ?? 'application/octet-stream',
        ]);
    }

    $index = $dist . '/index.html';
    return file_exists($index)
        ? response()->file($index)
        : response()->json(['error' => 'Not found'], 404);
})->where('path', '.*');
