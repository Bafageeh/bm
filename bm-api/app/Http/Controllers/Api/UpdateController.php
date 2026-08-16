<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UpdateController extends Controller
{
    public function manifest(Request $request)
    {
        $platform = $request->header('expo-platform', $request->query('platform', 'android'));
        $runtimeVersion = (string) $request->header('expo-runtime-version', $request->query('runtime-version', ''));
        $protocolVersion = (int) $request->header('expo-protocol-version', '1');

        if (!in_array($platform, ['android', 'ios'], true)) {
            return response()->json(['error' => 'Unsupported platform'], 400);
        }

        if ($runtimeVersion === '' || !preg_match('/^[A-Za-z0-9._-]+$/', $runtimeVersion)) {
            return response()->json(['error' => 'Invalid runtime version'], 400);
        }

        $release = $this->latestRelease($runtimeVersion);
        if (!$release) {
            return $this->noUpdateResponse($protocolVersion);
        }

        $releasePath = storage_path("app/expo-updates/{$runtimeVersion}/{$release}");
        $metadataPath = $releasePath.'/metadata.json';
        if (!is_file($metadataPath)) {
            return $this->noUpdateResponse($protocolVersion);
        }

        $metadataRaw = file_get_contents($metadataPath);
        $metadata = json_decode($metadataRaw, true);
        $platformMetadata = $metadata['fileMetadata'][$platform] ?? null;
        if (!$platformMetadata || empty($platformMetadata['bundle'])) {
            return $this->noUpdateResponse($protocolVersion);
        }

        $idHash = hash('sha256', $metadataRaw);
        $updateId = $this->hashToUuid($idHash);
        $currentUpdateId = (string) $request->header('expo-current-update-id', '');

        if ($protocolVersion >= 1 && $currentUpdateId !== '' && strtolower($currentUpdateId) === strtolower($updateId)) {
            return $this->noUpdateResponse($protocolVersion);
        }

        $assets = [];
        foreach (($platformMetadata['assets'] ?? []) as $asset) {
            if (empty($asset['path'])) {
                continue;
            }
            $assets[] = $this->assetMetadata(
                $runtimeVersion,
                $release,
                $releasePath,
                $asset['path'],
                $asset['ext'] ?? pathinfo($asset['path'], PATHINFO_EXTENSION),
                false,
                $platform
            );
        }

        $launchAsset = $this->assetMetadata(
            $runtimeVersion,
            $release,
            $releasePath,
            $platformMetadata['bundle'],
            'bundle',
            true,
            $platform
        );

        $expoConfigPath = $releasePath.'/expoConfig.json';
        $expoConfig = is_file($expoConfigPath)
            ? (json_decode(file_get_contents($expoConfigPath), true) ?: [])
            : ['name' => 'إدارة اتحاد الملاك', 'slug' => 'bm-mobile', 'runtimeVersion' => $runtimeVersion];

        $manifest = [
            'id' => $updateId,
            'createdAt' => gmdate('c', filemtime($metadataPath) ?: time()),
            'runtimeVersion' => $runtimeVersion,
            'assets' => $assets,
            'launchAsset' => $launchAsset,
            'metadata' => [],
            'extra' => ['expoClient' => $expoConfig],
        ];

        return $this->multipartResponse([
            ['manifest', $manifest],
            ['extensions', ['assetRequestHeaders' => (object) []]],
        ], max(1, $protocolVersion));
    }

    public function asset(Request $request)
    {
        $runtimeVersion = (string) $request->query('runtimeVersion', '');
        $release = (string) $request->query('release', '');
        $relativePath = rawurldecode((string) $request->query('path', ''));

        if (!preg_match('/^[A-Za-z0-9._-]+$/', $runtimeVersion)
            || !preg_match('/^[0-9]+$/', $release)
            || $relativePath === ''
            || str_contains($relativePath, '..')) {
            abort(400, 'Invalid update asset request');
        }

        $releasePath = realpath(storage_path("app/expo-updates/{$runtimeVersion}/{$release}"));
        $fullPath = realpath(storage_path("app/expo-updates/{$runtimeVersion}/{$release}/{$relativePath}"));

        if (!$releasePath || !$fullPath || !Str::startsWith($fullPath, $releasePath.DIRECTORY_SEPARATOR) || !is_file($fullPath)) {
            abort(404);
        }

        return response()->file($fullPath, [
            'Content-Type' => $this->mimeType(pathinfo($fullPath, PATHINFO_EXTENSION), false),
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    private function latestRelease(string $runtimeVersion): ?string
    {
        $base = storage_path("app/expo-updates/{$runtimeVersion}");
        if (!is_dir($base)) {
            return null;
        }

        $dirs = array_values(array_filter(scandir($base) ?: [], function ($item) use ($base) {
            return preg_match('/^[0-9]+$/', $item) && is_dir($base.'/'.$item);
        }));

        if (!$dirs) {
            return null;
        }

        usort($dirs, fn ($a, $b) => (int) $b <=> (int) $a);
        return $dirs[0];
    }

    private function assetMetadata(
        string $runtimeVersion,
        string $release,
        string $releasePath,
        string $relativePath,
        ?string $ext,
        bool $isLaunchAsset,
        string $platform
    ): array {
        $fullPath = realpath($releasePath.'/'.$relativePath);
        if (!$fullPath || !is_file($fullPath)) {
            abort(404, 'Update asset not found: '.$relativePath);
        }

        $bytes = file_get_contents($fullPath);
        $sha256 = base64_encode(hash('sha256', $bytes, true));
        $base64UrlHash = rtrim(strtr($sha256, '+/', '-_'), '=');
        $extension = $isLaunchAsset ? 'bundle' : ltrim((string) $ext, '.');

        return [
            'hash' => $base64UrlHash,
            'key' => md5($bytes),
            'fileExtension' => '.'.$extension,
            'contentType' => $this->mimeType($extension, $isLaunchAsset),
            'url' => url('/api/updates/assets').'?'.http_build_query([
                'runtimeVersion' => $runtimeVersion,
                'release' => $release,
                'platform' => $platform,
                'path' => $relativePath,
            ], '', '&', PHP_QUERY_RFC3986),
        ];
    }

    private function mimeType(?string $extension, bool $launchAsset): string
    {
        if ($launchAsset || $extension === 'bundle') {
            return 'application/javascript';
        }

        return match (strtolower((string) $extension)) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'json' => 'application/json',
            'ttf' => 'font/ttf',
            'otf' => 'font/otf',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'mp3' => 'audio/mpeg',
            'wav' => 'audio/wav',
            'mp4' => 'video/mp4',
            default => 'application/octet-stream',
        };
    }

    private function hashToUuid(string $hash): string
    {
        $value = substr($hash, 0, 32);
        return substr($value, 0, 8).'-'.substr($value, 8, 4).'-'.substr($value, 12, 4).'-'.substr($value, 16, 4).'-'.substr($value, 20, 12);
    }

    private function noUpdateResponse(int $protocolVersion)
    {
        return $this->multipartResponse([
            ['directive', ['type' => 'noUpdateAvailable']],
        ], max(1, $protocolVersion));
    }

    private function multipartResponse(array $parts, int $protocolVersion)
    {
        $boundary = 'expo-'.bin2hex(random_bytes(12));
        $body = '';

        foreach ($parts as [$name, $payload]) {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n";
            $body .= "Content-Type: application/json; charset=utf-8\r\n\r\n";
            $body .= json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\r\n";
        }

        $body .= "--{$boundary}--\r\n";

        return response($body, 200, [
            'Content-Type' => "multipart/mixed; boundary={$boundary}",
            'expo-protocol-version' => (string) $protocolVersion,
            'expo-sfv-version' => '0',
            'Cache-Control' => 'private, max-age=0, no-cache',
        ]);
    }
}
