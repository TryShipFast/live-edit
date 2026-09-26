<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Application\Api\AssistWithText;
use ShipFast\LiveEdit\Domain\Credits\CreditEntry;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Credits are money, so these are the cases where money goes missing.
 *
 * A balance that can go below zero is a balance a customer can argue with, and
 * a charge for something that was never delivered is the fastest way to have
 * the whole credit system distrusted. Both are cheap to get wrong and
 * expensive to be wrong about.
 */
class CreditsTest extends TestCase
{
    protected Site $site;

    protected Credits $credits;

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'client', 'name' => 'Client', 'allowed_origins' => []]);
        $this->credits = app(Credits::class);
    }

    /**
     * A configured model, for the cases that need one.
     *
     * The whole live-edit config is replaced in these tests, so the ai block
     * is absent unless it is put back — and an absent endpoint made the
     * request throw, which the caller reports as "no suggestion". That failure
     * looked exactly like the model returning nothing.
     */
    protected function withModel(): void
    {
        config()->set('live-edit.ai', [
            'enabled' => true,
            'endpoint' => 'https://api.openai.test/v1/chat/completions',
            'model' => 'test-model',
            'api_key' => 'test-key-not-real',
            'timeout' => 5,
        ]);
    }

    public function test_a_site_starts_with_nothing_and_a_grant_is_what_it_has(): void
    {
        $this->assertSame(0, $this->credits->balance($this->site));

        $this->credits->grant($this->site, 100, 'purchase');

        $this->assertSame(100, $this->credits->balance($this->site));
    }

    public function test_spending_takes_the_cost_of_that_action_and_nothing_else(): void
    {
        $this->credits->grant($this->site, 10);

        $this->assertSame(9, $this->credits->spend($this->site, 'rewrite'));
        $this->assertSame(7, $this->credits->spend($this->site, 'translate_block'));
        $this->assertSame(2, $this->credits->spend($this->site, 'generate_image'));
    }

    public function test_it_refuses_rather_than_going_below_zero(): void
    {
        // The whole point. A balance that can go negative is one a customer
        // can argue with, and they would be right.
        $this->credits->grant($this->site, 3);

        $this->assertNull($this->credits->spend($this->site, 'generate_image'), 'a 5-credit action was allowed on a balance of 3');
        $this->assertSame(3, $this->credits->balance($this->site), 'the refused action still took something');
    }

    public function test_the_last_credit_can_only_be_spent_once(): void
    {
        // Two tabs pressing Rewrite at the same moment each read a balance of
        // one and each decide they can afford it. The site pays once and is
        // charged twice.
        $this->credits->grant($this->site, 1);

        $first = $this->credits->spend($this->site, 'rewrite');
        $second = $this->credits->spend($this->site, 'rewrite');

        $this->assertSame(0, $first);
        $this->assertNull($second);
        $this->assertSame(0, $this->credits->balance($this->site));
    }

    public function test_the_ledger_says_where_every_credit_went(): void
    {
        // A number that went down and cannot say why is indistinguishable from
        // one that went down for no reason, and somebody paid for it.
        $this->credits->grant($this->site, 10, 'purchase');
        $this->credits->spend($this->site, 'rewrite', ['page' => '/about']);

        $entries = CreditEntry::query()->where('site_id', $this->site->id)->orderBy('id')->get();

        $this->assertSame([10, -1], $entries->pluck('delta')->all());
        $this->assertSame(['purchase', 'rewrite'], $entries->pluck('reason')->all());
        $this->assertSame('/about', $entries->last()->meta['page']);
    }

    public function test_work_that_was_never_delivered_is_not_charged_for(): void
    {
        // Keeping the credit when the model returns nothing usable is charging
        // for silence.
        $this->withModel();

        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => '']]]], 200)]);

        $this->credits->grant($this->site, 5);

        $result = app(AssistWithText::class)(
            $this->site, 'rewrite', 'Family care, close to home.'
        );

        $this->assertNull($result['text']);
        $this->assertSame('no_suggestion', $result['reason']);
        $this->assertSame(5, $this->credits->balance($this->site), 'a rewrite that produced nothing was still charged for');
    }

    public function test_a_rewrite_that_worked_is_charged_for_once(): void
    {
        $this->withModel();

        Http::fake(['*' => Http::response([
            'choices' => [['message' => ['content' => '"Same-day family care in Ikeja."']]],
        ], 200)]);

        $this->credits->grant($this->site, 5);

        $result = app(AssistWithText::class)(
            $this->site, 'rewrite', 'Family care, close to home.'
        );

        // The quotes come off: a model wraps its answer in them even when told
        // not to, and a heading that arrives wearing them looks like a fault.
        $this->assertSame('Same-day family care in Ikeja.', $result['text']);
        $this->assertSame(4, $result['balance']);
    }

    public function test_nothing_is_charged_when_there_is_nothing_to_rewrite(): void
    {
        $this->withModel();
        Http::fake();

        $this->credits->grant($this->site, 5);

        $result = app(AssistWithText::class)($this->site, 'rewrite', '   ');

        $this->assertSame('nothing_to_work_with', $result['reason']);
        $this->assertSame(5, $this->credits->balance($this->site));
        Http::assertNothingSent();
    }

    public function test_an_unaffordable_rewrite_never_reaches_the_model(): void
    {
        // Asking first and refusing afterwards would mean paying somebody
        // else's bill for an answer we then throw away.
        $this->withModel();
        Http::fake();

        $result = app(AssistWithText::class)(
            $this->site, 'rewrite', 'Family care, close to home.'
        );

        $this->assertSame('not_enough_credits', $result['reason']);
        Http::assertNothingSent();
    }

    public function test_it_says_so_rather_than_pretending_when_no_model_is_configured(): void
    {
        $this->withModel();
        config()->set('live-edit.ai.enabled', false);

        $this->credits->grant($this->site, 5);

        $result = app(AssistWithText::class)(
            $this->site, 'rewrite', 'Family care, close to home.'
        );

        $this->assertSame('not_configured', $result['reason']);
        $this->assertSame(5, $this->credits->balance($this->site), 'a site with no model configured was charged anyway');
    }
}
