<?php

namespace ShipFast\LiveEdit\Tests\WordPress {

    use KastsBuild\Licence;
    use ReflectionMethod;
    use ShipFast\LiveEdit\Tests\TestCase;

    /**
     * A licence answer and its outage grace belong to the hostname that asked.
     *
     * One WordPress install can answer on its main domain and subdomains. Reusing
     * a transient across those requests let the main domain's good answer open the
     * editor on every alias until the cache expired.
     */
    class WordPressLicenceHostTest extends TestCase
    {
        protected function setUp(): void
        {
            parent::setUp();

            require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Settings.php';
            require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Licence.php';
        }

        public function test_answer_and_outage_grace_keys_are_scoped_to_the_request_host(): void
        {
            $_SERVER['HTTP_HOST'] = 'site.com';

            $answerForRoot = $this->key('answerKey');
            $graceForRoot = $this->key('lastGoodKey');

            $_SERVER['HTTP_HOST'] = 'members.site.com';

            $this->assertNotSame($answerForRoot, $this->key('answerKey'));
            $this->assertNotSame($graceForRoot, $this->key('lastGoodKey'));
        }

        public function test_an_unchecked_subdomain_is_not_treated_as_an_offline_exception(): void
        {
            $_SERVER['HTTP_HOST'] = 'members.site.com';

            $method = new ReflectionMethod(Licence::class, 'isCanonicalOrLocalRequestHost');

            $this->assertFalse($method->invoke(null));

            $_SERVER['HTTP_HOST'] = 'www.site.com';
            $this->assertTrue($method->invoke(null));

            $_SERVER['HTTP_HOST'] = 'preview.test';
            $this->assertTrue($method->invoke(null));
        }

        private function key(string $method): string
        {
            $method = new ReflectionMethod(Licence::class, $method);

            return $method->invoke(null);
        }
    }
}

namespace {
    if (! function_exists('wp_parse_url')) {
        function wp_parse_url(string $url, int $component = -1): mixed
        {
            return parse_url($url, $component);
        }
    }

    if (! function_exists('home_url')) {
        function home_url(string $path = '/'): string
        {
            return 'https://site.com'.$path;
        }
    }

    if (! function_exists('home_url')) {
        function home_url(string $path = '/'): string
        {
            return 'https://site.com'.$path;
        }
    }
}
