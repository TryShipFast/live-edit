<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Cache;
use ShipFast\LiveEdit\Application\Api\TagMarkup;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Two people, one page, two different answers.
 *
 * A developer sees the whole site; somebody they invited sees what is left
 * after data-live-lock. That is the feature. The hazard arrives with the cache
 * that makes the second visit free: it is keyed on the markup and the page,
 * and the markup and the page are identical for both of them.
 *
 * So without the asking person in the key, whoever opened the page first would
 * decide what everybody else could edit. A developer working in the morning
 * caches the unlocked answer, and every client after them is handed it - the
 * guardrail silently absent, on a page that looks exactly as it should.
 *
 * Worth a test of its own because it fails in only one direction and only
 * sometimes: in a fresh environment the cache is cold, the right answer is
 * computed, and nothing is wrong until the day somebody else got there first.
 */
class ALockIsNotCachedAcrossPeopleTest extends TestCase
{
    private Site $site;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('live-edit.tag_cache_seconds', 86400);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client']);
    }

    private const PAGE = '<html><body>'
        .'<nav data-live-lock><a href="/pricing">Pricing</a></nav>'
        .'<main><h1>Promote your music</h1></main>'
        .'</body></html>';

    private function tagFor(bool $mayEditLocked): string
    {
        return (new TagMarkup)($this->site, self::PAGE, '/', $mayEditLocked)['html']
            ?? json_encode((new TagMarkup)($this->site, self::PAGE, '/', $mayEditLocked));
    }

    private function offeredIn(string $answer): int
    {
        return substr_count($answer, 'data-edit');
    }

    public function test_the_developer_asking_first_does_not_unlock_it_for_everybody(): void
    {
        // The order that breaks it: the unlocked answer is computed and cached
        // first, and the next question is a different question.
        $developer = $this->tagFor(true);
        $invited = $this->tagFor(false);

        $this->assertGreaterThan(
            $this->offeredIn($invited),
            $this->offeredIn($developer),
            'the invited editor was handed the developer\'s answer out of the cache'
        );
    }

    public function test_and_not_the_other_way_round_either(): void
    {
        // The same fault reversed would lock a developer out of their own site,
        // which is the version somebody would actually report.
        $invited = $this->tagFor(false);
        $developer = $this->tagFor(true);

        $this->assertGreaterThan($this->offeredIn($invited), $this->offeredIn($developer));
    }

    public function test_the_same_person_asking_twice_still_costs_once(): void
    {
        /*
         * The cache has to keep working. Splitting a key is the easy way to
         * make something correct and useless, and tagging is the slowest thing
         * on the path to a page's own words.
         */
        $tagger = new TagMarkup;

        $tagger($this->site, self::PAGE, '/', false);
        $this->assertFalse($tagger->remembered, 'the first ask should have done the work');

        $tagger($this->site, self::PAGE, '/', false);
        $this->assertTrue($tagger->remembered, 'the second ask did not use the cache');
    }
}
