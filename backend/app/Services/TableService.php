<?php

namespace App\Services;

use App\Models\Restaurant;
use App\Models\RestaurantTable;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Str;

class TableService
{
    public function getTables(Restaurant $restaurant): array
    {
        return RestaurantTable::where('restaurant_id', $restaurant->id)
            ->orderBy('table_number')
            ->get()
            ->map(function ($table) use ($restaurant) {
                return [
                    'id' => $table->id,
                    'tableNumber' => $table->table_number,
                    'qrCodeUrl' => $table->qr_code_path,
                    'qrTargetUrl' => $table->qr_target_url,
                    'createdAt' => $table->created_at,
                    'legacyToken' => $restaurant->id . '-' . $table->table_number,
                ];
            })
            ->toArray();
    }

    public function createTable(Restaurant $restaurant, string $tableNumber): RestaurantTable
    {
        $exists = RestaurantTable::where('restaurant_id', $restaurant->id)
            ->where('table_number', $tableNumber)
            ->exists();

        if ($exists) {
            abort(409, 'Table already exists. Use a different table number.');
        }

        $targetUrl = config('app.public_app_url', 'http://localhost:5173')
            . '/order/' . urlencode($restaurant->public_slug)
            . '?table=' . urlencode($tableNumber);

        $qrCodePath = $this->generateQrCode($restaurant->id, $tableNumber, $targetUrl);

        return RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'table_number' => $tableNumber,
            'qr_code_path' => $qrCodePath,
            'qr_target_url' => $targetUrl,
        ]);
    }

    public function deleteTable(string $tableId, string $restaurantId): ?RestaurantTable
    {
        $table = RestaurantTable::where('id', $tableId)
            ->where('restaurant_id', $restaurantId)
            ->first();

        if (!$table) return null;

        $table->delete();
        return $table;
    }

    private function generateQrCode(string $restaurantId, string $tableNumber, string $targetUrl): string
    {
        if (!extension_loaded('gd')) {
            return '';
        }

        $filename = Str::slug($restaurantId . '-' . $tableNumber) . '-' . substr(Str::uuid()->toString(), 0, 8) . '.png';
        $qrRelPath = 'qr-codes/' . $filename;
        $absolutePath = storage_path('app/public/' . $qrRelPath);

        $dir = dirname($absolutePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $qrCode = new QRCode(
            new QROptions([
                'outputInterface' => QRGdImagePNG::class,
                'eccLevel' => EccLevel::L,
                'scale' => 10,
                'outputBase64' => false,
            ])
        );
        $qrCode->render($targetUrl, $absolutePath);

        return '/storage/' . $qrRelPath;
    }
}
