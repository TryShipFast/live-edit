<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Support\Facades\Mail;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\RenewalNotices;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Mail\LicenceExpiring;

/**
 * Warning somebody their editor is about to switch off.
 *
 * Two failures matter here and they pull against each other. Saying nothing
 * means a customer discovers the licence ended by opening their site and
 * finding the toolbar gone. Saying it every morning for a month means they
 * stop reading anything we send, including the message on the last day.
 *
 * So the shape being defended is: once per step down, never the same step
 * twice, and the date written in the reader's own timezone because an email
 * has no browser to convert it later.
 */
class RenewalNoticesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function siteExpiringIn(int $days, array $attributes = []): Site
    {
        $site = Site::query()->create(array_merge([
            'slug' => 'acme',
            'name' => 'Acme',
            'timezone' => 'Africa/Lagos',
        ], $attributes));

        $site->issueToken(TokenType::Publishable, 'Web', null, now()->addDays($days));

        $editor = Editor::query()->create(['email' => 'tope@acme.test', 'name' => 'Tope']);
        $site->editors()->attach($editor->id, ['may_publish' => true]);

        return $site;
    }

    public function test_most_of_the_year_is_silent(): void
    {
        $this->siteExpiringIn(200);

        RenewalNotices::send();

        Mail::assertNothingSent();
    }

    public function test_a_month_out_is_worth_saying(): void
    {
        $this->siteExpiringIn(29);

        RenewalNotices::send();

        Mail::assertSent(LicenceExpiring::class, fn ($mail) => $mail->hasTo('tope@acme.test'));
    }

    public function test_the_same_step_is_not_said_twice(): void
    {
        $site = $this->siteExpiringIn(29);

        RenewalNotices::send();
        Mail::assertSentCount(1);

        // The next morning, and the morning after. Nothing has changed except
        // the calendar, and a daily repeat is how somebody learns to filter us.
        $this->travel(1)->days();
        RenewalNotices::send();
        $this->travel(1)->days();
        RenewalNotices::send();

        Mail::assertSentCount(1);
        $this->assertSame(30, (int) $site->fresh()->renewal_notice_days);
    }

    public function test_each_step_down_is_said_once(): void
    {
        $this->siteExpiringIn(29);

        RenewalNotices::send();          // the 30 step
        $this->travel(23)->days();       // now 6 days left
        RenewalNotices::send();          // the 7 step
        $this->travel(5)->days();        // now 1 day left
        RenewalNotices::send();          // the 1 step
        $this->travel(2)->days();        // now past it
        RenewalNotices::send();          // the expired notice

        Mail::assertSentCount(4);
    }

    public function test_the_last_one_explains_rather_than_warns(): void
    {
        $this->siteExpiringIn(-2);

        RenewalNotices::send();

        Mail::assertSent(LicenceExpiring::class, function (LicenceExpiring $mail) {
            // Nobody needs warning about something that already happened. What
            // they need is to know the website is fine.
            $this->assertSame(0, $mail->days);
            $this->assertStringContainsString('Editing has stopped', $mail->envelope()->subject);

            return true;
        });
    }

    public function test_renewing_lets_the_warnings_start_again(): void
    {
        $site = $this->siteExpiringIn(3);

        RenewalNotices::send();
        $this->assertSame(7, (int) $site->fresh()->renewal_notice_days);

        // Paid, and the licence pushed out a year. Without clearing the mark
        // the site could never be warned again, because every future step is
        // higher than the one it stopped at.
        $site->tokens()->update(['expires_at' => now()->addYear()]);
        $site->forceFill(['renewal_notice_days' => null])->save();

        $this->travel(360)->days();
        RenewalNotices::send();

        Mail::assertSentCount(2);
    }

    public function test_the_date_is_written_in_the_sites_own_timezone(): void
    {
        // Just after midnight UTC, which is still the previous evening in Los
        // Angeles. An email is rendered hours before it is opened, so there is
        // no browser to fix this later.
        $site = $this->siteExpiringIn(3, ['timezone' => 'America/Los_Angeles']);
        $site->tokens()->update(['expires_at' => now()->addDays(3)->setTime(1, 0)]);

        RenewalNotices::send();

        Mail::assertSent(LicenceExpiring::class, function (LicenceExpiring $mail) {
            $expected = now()->addDays(3)->setTime(1, 0)->setTimezone('America/Los_Angeles')->isoFormat('D MMMM YYYY');

            $this->assertSame($expected, $mail->on);

            return true;
        });
    }

    public function test_a_site_with_nobody_to_tell_does_not_bank_up_warnings(): void
    {
        $site = $this->siteExpiringIn(29);
        $site->editors()->detach();

        RenewalNotices::send();

        Mail::assertNothingSent();

        // Recorded all the same, so adding an editor tomorrow does not deliver
        // a month of backdated warnings the moment they arrive.
        $this->assertSame(30, (int) $site->fresh()->renewal_notice_days);
    }

    public function test_a_suspended_site_is_not_chased_for_renewal(): void
    {
        $this->siteExpiringIn(3, ['suspended_at' => now()]);

        RenewalNotices::send();

        Mail::assertNothingSent();
    }

    public function test_a_signed_in_session_is_not_mistaken_for_the_licence(): void
    {
        $site = $this->siteExpiringIn(200);

        // A session is an api token too and lives half an hour. Read as the
        // licence it would make a site with most of a year left look like it
        // expires today.
        $site->issueToken(TokenType::Session, 'Tope', null, now()->addMinutes(30));

        RenewalNotices::send();

        Mail::assertNothingSent();
    }
}
