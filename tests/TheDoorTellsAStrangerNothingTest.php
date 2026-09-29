<?php

namespace ShipFast\LiveEdit\Tests;

class TheDoorTellsAStrangerNothingTest extends TestCase
{
    /**
     * What a public URL is allowed to say about how a site is wired.
     *
     * /live-edit/enter is reachable by anybody. It used to answer an
     * unconfigured install with "Add LIVE_EDIT_SITE and LIVE_EDIT_KEY to its
     * environment", which hands a stranger a map of the wiring and an
     * advertisement that the site is misconfigured, tells it to a visitor who
     * can do nothing with it, and names two variables that stopped being the
     * current spelling some time ago.
     */
    private function unconfigured(): void
    {
        config()->set('live-edit.licence.site', null);
        config()->set('live-edit.licence.key', null);
        config()->set('live-edit.cloud.site', null);
        config()->set('live-edit.cloud.host', null);
    }

    public function test_it_names_no_environment_variable_to_the_browser(): void
    {
        $this->unconfigured();

        $body = $this->get('/live-edit/enter?to=%2F')->assertStatus(409)->getContent();

        $this->assertStringNotContainsString('LIVE_EDIT', (string) $body);
        $this->assertStringNotContainsString('environment', (string) $body);
        $this->assertStringContainsString('Editing is not available', (string) $body);
    }

    public function test_a_site_whose_words_live_with_us_has_no_door_here(): void
    {
        /*
         * This door belongs to the arrangement where the site keeps its own
         * content. A cloud site signs in through the script we serve it,
         * which opens its own door on any page.
         *
         * It used to be told it "is not registered for editing yet", which is
         * wrong and is the most alarming thing to say to somebody who has
         * just finished setting it up correctly.
         */
        config()->set('live-edit.licence.site', null);
        config()->set('live-edit.licence.key', null);
        config()->set('live-edit.cloud.site', 'learnkasts');
        config()->set('live-edit.cloud.host', 'https://live.tryshipfast.com');

        $this->get('/live-edit/enter?to=%2F')->assertNotFound();
    }

    public function test_it_will_not_send_anybody_to_another_site(): void
    {
        // The destination is a path on this site or nothing. An absolute URL
        // here would let a link decide where a freshly signed-in editor
        // lands, which is somebody else's page wearing this site's session.
        config()->set('live-edit.licence.site', 'acme');
        config()->set('live-edit.licence.key', 'kbp_test');
        config()->set('live-edit.cloud.site', null);

        foreach (['https://evil.test/steal', '//evil.test/steal', 'javascript:alert(1)'] as $hostile) {
            $body = (string) $this->get('/live-edit/enter?to='.urlencode($hostile))->getContent();

            $this->assertStringNotContainsString('evil.test', $body);
            $this->assertStringNotContainsString('javascript:', $body);
        }
    }
}
