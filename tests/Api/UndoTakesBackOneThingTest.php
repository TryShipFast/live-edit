<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Http\Request;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Undo takes back what somebody just did, not everything they have ever done.
 *
 * Reported from a real site: "a revert reverts all the changes instead of the
 * revert you actually wanted." It did exactly that.
 *
 * Undo works on a batch, because one press of Save can be several settings -
 * replacing a picture writes the source, the description, the title and the
 * photographer's name, and taking back only the last would leave a photograph
 * on the page with somebody else's name under it. So the batch has to be one
 * action.
 *
 * The API's batch was `api:<site>:<token>`, which is the same string for every
 * edit that key will ever make. Every change ever saved through the API was
 * therefore one batch, and one undo took the client's whole history back.
 *
 * The editor's own controller had this right from the start, with a note
 * explaining why the batch cannot live on the controller instance. The two
 * paths now share one implementation, because two implementations of one rule
 * is how a cloud site and a self-hosted one come to behave differently - which
 * is the second time that has bitten this week.
 */
class UndoTakesBackOneThingTest extends TestCase
{
    private function site(): array
    {
        $site = Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);

        [$token] = $site->issueToken(TokenType::Secret, 'Web', null, now()->addYear());

        return [$site, $token];
    }

    public function test_two_separate_saves_are_two_separate_batches(): void
    {
        config()->set('live-edit.auto_keys', true);

        [$site, $token] = $this->site();
        $apply = app(ApplyEdit::class);

        // Two requests. In a test they are two calls, and the batch is held on
        // the request - so this is refreshed between them the way a second
        // HTTP request would be.
        $apply($site, $token, 'auto:1a2b3c4d5e6f', 'First change');

        // A second request. The batch is held on the request, so replacing it
        // is what a second HTTP call does - and doing it this way rather than
        // rebuilding the application keeps the database that the first save
        // wrote to.
        $this->app->instance('request', Request::create('/', 'POST'));

        $apply($site, $token, 'auto:9f8e7d6c5b4a', 'Second change');

        $batches = EditRevision::query()->pluck('batch')->unique();

        $this->assertCount(
            2,
            $batches,
            'every edit through the API shared one batch, so undoing once would take back the whole history'
        );
    }

    public function test_settings_saved_together_stay_together(): void
    {
        /*
         * The reason a batch exists at all. A picture and its description are
         * written by one press of Save, inside one request, and undo has to
         * take back both - a photograph left with the previous one's credit is
         * a false statement about who took it.
         */
        config()->set('live-edit.auto_keys', true);

        [$site, $token] = $this->site();
        $apply = app(ApplyEdit::class);

        $apply($site, $token, 'auto:1a2b3c4d5e6f', 'https://example.com/new.jpg');
        $apply($site, $token, 'auto:1a2b3c4d5e6fAlt', 'A new description');

        $this->assertCount(
            1,
            EditRevision::query()->pluck('batch')->unique(),
            'a picture and its description were split across batches, so undo would take back only one of them'
        );
    }

    public function test_the_batch_still_says_who_made_it(): void
    {
        // Worth keeping: it is what tells somebody reading the table that a row
        // came through the API rather than the editor, and under which key.
        config()->set('live-edit.auto_keys', true);

        [$site, $token] = $this->site();

        app(ApplyEdit::class)($site, $token, 'auto:1a2b3c4d5e6f', 'Words');

        $this->assertStringStartsWith('api:acme:', (string) EditRevision::query()->value('batch'));
    }
}
