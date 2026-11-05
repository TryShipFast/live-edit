<?php

/*
 * The autoloader for the team-editing journeys and load test.
 *
 * On PHP 8.4 and later this is simply vendor/autoload.php. Below 8.4 the lock
 * file's platform check refuses to start (PHPUnit 13 wants 8.4), although
 * nothing the API needs does. So below 8.4 the same class map is loaded
 * without the platform check, and PHPUnit's own classes are left unloaded
 * (testbench only asks whether they exist).
 */

$vendor = dirname(__DIR__, 3).'/vendor';

if (PHP_VERSION_ID >= 80400) {
    return require $vendor.'/autoload.php';
}

require_once $vendor.'/composer/ClassLoader.php';
preg_match('/ComposerStaticInit[0-9a-f]+/', (string) file_get_contents($vendor.'/composer/autoload_static.php'), $found);
require_once $vendor.'/composer/autoload_static.php';
$init = 'Composer\\Autoload\\'.$found[0];
$loader = new \Composer\Autoload\ClassLoader($vendor);
call_user_func($init::getInitializer($loader));

// PHPUnit's files are 8.4 syntax: taken out of the map, so class_exists() reads false.
$map = new ReflectionProperty($loader, 'classMap');
$map->setValue($loader, array_filter($map->getValue($loader), fn ($class) => ! str_starts_with($class, 'PHPUnit\\'), ARRAY_FILTER_USE_KEY));
$loader->register(false);

foreach ($init::$files as $file) {
    if (! str_contains($file, '/phpunit/')) {
        require_once $file;
    }
}

return $loader;
