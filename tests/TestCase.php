<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
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

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * No test may call the internet.
         *
         * The licence answer below has been pinned for a while for exactly
         * this reason, but it pinned one call rather than closing the door.
         * Published content for a cloud install is now read over HTTP during
         * a page render, so a test that forgets to fake it would reach the
         * real service - slowly, flakily, and with whatever happens to be
         * published there deciding the result.
         *
         * A test that wants an answer fakes one. A test that gets this
         * exception has found a call it did not know it was making, which is
         * the point.
         */
        Http::preventStrayRequests();

        // Answered here so no test asks the network whether an invented
        // licence is real. A test that wants a lapsed or refused one
        // overwrites this key itself.
        Cache::forever('live-edit.licence.v1.answer', [
            'valid' => true,
            'site' => 'test-site',
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('database.default', 'testbench');

        /*
         * A registered site, because that is what almost every test here is
         * about: a customer who has paid, editing their own words.
         *
         * An install that names no site and holds no key is now refused the
         * editor, which is the point of registering at all. Leaving the suite
         * unregistered would have meant every one of these tests quietly
         * exercising the one state the product does not support, and the
         * thirty-three failures that appeared when that changed were the
         * suite saying so.
         *
         * The answer is primed rather than fetched so no test reaches for the
         * network to find out whether a made-up licence is valid.
         */
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
            /*
             * A registered site, because that is what almost every test here
             * is about: a customer who has paid, editing their own words.
             *
             * An install naming no site and holding no key is now refused the
             * editor, which is the point of registering at all. Without this
             * the whole suite would be exercising the one state the product
             * does not support, and the thirty-three failures that appeared
             * when the rule changed were the suite saying exactly that.
             */
            'licence' => [
                'host' => 'https://live.shipfast.test',
                'site' => 'test-site',
                'key' => 'kbp_test_licence_key',
                'ttl' => 86400,
            ],
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
