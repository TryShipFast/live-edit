<?php

// The API behind `php -S`: every request boots the app and is handled by its HTTP kernel.
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$app = require __DIR__.'/boot.php';

// How many queries this request asked, for the load test (DB queries per poll).
$queries = 0;
DB::listen(function ($query) use (&$queries) {
    $queries++;
    if (getenv('LIVE_EDIT_LOG_SQL')) {
        error_log($_SERVER['REQUEST_URI'].' :: '.$query->sql);
    }
});

$kernel = $app->make(Kernel::class);
$request = Request::capture();
$response = $kernel->handle($request);
$response->headers->set('X-Queries', (string) $queries);
$response->send();
$kernel->terminate($request, $response);
