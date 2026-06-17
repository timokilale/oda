<?php

namespace App\Console\Commands;

use App\Models\RestaurantTable;
use chillerlan\QRCode\Common\EccLevel;
use chillerlan\QRCode\Output\QRGdImagePNG;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RegenerateTableQrCodes extends Command
{
    protected $signature = 'app:regenerate-table-qr-codes';
    protected $description = 'Regenerate QR code images for all tables with the current PUBLIC_APP_URL';

    public function handle()
    {
        if (!extension_loaded('gd')) {
            $this->error('GD extension is required to generate QR codes.');
            return 1;
        }

        $tables = RestaurantTable::all();
        $count = 0;

        foreach ($tables as $table) {
            $restaurant = $table->restaurant;
            if (!$restaurant) continue;

            $targetUrl = config('app.public_app_url')
                . '/order/' . urlencode($restaurant->public_slug)
                . '?table=' . urlencode($table->table_number);

            $qrRelPath = $this->generateQrCode($restaurant->id, $table->table_number, $targetUrl);

            if ($qrRelPath) {
                $table->update([
                    'qr_code_path' => $qrRelPath,
                    'qr_target_url' => $targetUrl,
                ]);
                $this->info("Table {$table->table_number}: {$targetUrl}");
                $count++;
            }
        }

        $this->info("Regenerated {$count} QR codes.");
    }

    private function generateQrCode(string $restaurantId, string $tableNumber, string $targetUrl): ?string
    {
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
