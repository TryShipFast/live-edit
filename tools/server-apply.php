#!/usr/bin/env php
<?php

/**
 * What the server would render, for comparison with what the browser renders.
 *
 * The same content has two implementations: PHP applies it before a page is
 * sent, JavaScript applies it in a page nobody server-renders. Six faults so
 * far were one of those two quietly doing nothing, every one invisible to
 * tests that only exercised one side.
 *
 * So the parity test runs both. This is the server half: markup and overrides
 * in, the applied markup and stylesheet out.
 */

require __DIR__.'/../vendor/autoload.php';

use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Support\StyleCss;

$input = json_decode((string) file_get_contents('php://stdin'), true);

if (! is_array($input) || ! isset($input['html'])) {
    fwrite(STDERR, "Expected JSON on stdin: {html, overrides, styles}\n");
    exit(1);
}

$html = (string) $input['html'];
$overrides = (array) ($input['overrides'] ?? []);
$styles = (array) ($input['styles'] ?? []);

echo json_encode([
    'html' => (new MarkupScanner)->applyOverrides($html, $overrides),
    'css' => StyleCss::render([], $styles),
]);
