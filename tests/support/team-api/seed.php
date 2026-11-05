<?php

// A fresh site "demo" with its team, and their keys as JSON on stdout.
use Illuminate\Support\Facades\Artisan;
use ShipFast\LiveEdit\Application\Api\IssueEditSession;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;

$dir = rtrim((string) getenv('LIVE_EDIT_TEAM_DIR'), '/');
@mkdir($dir, 0777, true);
@unlink($dir.'/team.sqlite');
@unlink($dir.'/now');
touch($dir.'/team.sqlite');
foreach (glob($dir.'/cache/*/*/*') ?: [] as $file) {
    @unlink($file);
}

$app = require __DIR__.'/boot.php';
Artisan::call('migrate', ['--force' => true]);

$sites = max(1, (int) ($argv[1] ?? 1));
$people = [
    'ada' => ['id' => 'u-ada', 'name' => 'Ada', 'role' => 'editor'],
    'tunde' => ['id' => 'u-tunde', 'name' => 'Tunde', 'role' => 'editor'],
    'kemi' => ['id' => 'u-kemi', 'name' => 'Kemi', 'role' => 'editor'],
    'olu' => ['id' => 'u-olu', 'name' => 'Olu', 'role' => 'owner'],
];
$extra = max(0, (int) ($argv[2] ?? 0));
for ($i = 1; $i <= $extra; $i++) {
    $people['e'.$i] = ['id' => 'u-e'.$i, 'name' => 'Editor '.$i, 'role' => 'editor'];
}

$out = [];
for ($n = 0; $n < $sites; $n++) {
    $slug = $n === 0 ? 'demo' : 'demo'.$n;
    $site = Site::query()->create(['slug' => $slug, 'name' => 'Vellum '.$n, 'allowed_origins' => []]);
    [, $publishable] = $site->issueToken(TokenType::Publishable, 'Web');
    $tokens = ['visitor' => $publishable];
    foreach ($people as $key => $person) {
        if ($n > 0 && ! in_array($key, ['ada', 'olu'], true)) {
            continue;
        }
        $tokens[$key] = app(IssueEditSession::class)($site, $person['name'], 86400, true, $person)['token'];
    }
    $out[$slug] = $tokens;
}

echo json_encode($out);
