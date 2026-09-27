<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Orchestra\Testbench\TestCase as Orchestra;
use ShipFast\LiveEdit\LiveEditServiceProvider;
use ShipFast\LiveEdit\Tests\Fixtures\Setting;
use ShipFast\LiveEdit\Tests\Fixtures\Widget;

abstract class TestCase extends Orchestra
{
    use RefreshDatabase;

    protected function getPackageProviders($app): array
    {
        return [LiveEditServiceProvider::class];
    }

    protected function defineDatabaseMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/Fixtures/migrations');
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('database.default', 'testbench');

        /*
         * SQLite in memory, unless a MySQL database is named.
         *
         * The two disagree about enough to matter — a migration that drops a
         * column, in particular, meets completely different objections on
         * each — and a suite that only ever runs on SQLite will say a
         * migration is fine right up until it is run on a customer's MySQL.
         * LIVE_EDIT_TEST_MYSQL=<database> points the whole suite at MySQL.
         */
        $mysql = env('LIVE_EDIT_TEST_MYSQL');

        $app['config']->set('database.connections.testbench', $mysql
            ? [
                'driver' => 'mysql',
                'host' => env('LIVE_EDIT_TEST_MYSQL_HOST', '127.0.0.1'),
                'port' => env('LIVE_EDIT_TEST_MYSQL_PORT', '3306'),
                'database' => $mysql,
                'username' => env('LIVE_EDIT_TEST_MYSQL_USER', 'root'),
                'password' => env('LIVE_EDIT_TEST_MYSQL_PASSWORD', ''),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
            ]
            : [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
            ]);

        // A deliberately different content shape than the tokreamsblue app:
        // a 'Widget' collection with body/icon/image fields. If the generic
        // controller works here, it works for any host's own models.
        $app['config']->set('live-edit', [
            'setting_model' => Setting::class,
            'middleware' => ['web'],
            'default_locale' => 'en',
            'locales' => ['en' => 'English', 'fr' => 'Français'],
            'settings' => ['tagline', 'ctaHref', 'ctaTarget', 'mapEmbed', 'quotePlaceholder'],
            'images' => ['banner', 'heroBg'],
            'models' => [
                'widget' => [
                    'class' => Widget::class,
                    'fields' => ['title', 'body', 'icon', 'image'],
                    'image_field' => 'image',
                    'creatable' => true,
                    'deletable' => true,
                    'defaults' => ['title' => 'New widget', 'body' => 'Body.'],
                ],
            ],
            'style_props' => ['background' => 'color', 'paddingY' => 'px', 'hidden' => 'toggle'],
            'icon_options' => ['star', 'bolt', 'heart'],
            'select_options' => [],
            'rich_settings' => [],
            'rich_fields' => ['widget.body'],
            'disk' => 'public',
            'directory' => 'live-edit',
            'after_save' => null,
        ]);
    }

    protected function widget(array $attributes = []): Widget
    {
        return Widget::query()->create(array_merge([
            'sort' => Widget::query()->max('sort') + 1,
            'title' => 'Widget',
            'body' => 'Body',
            'icon' => 'star',
        ], $attributes));
    }
}
