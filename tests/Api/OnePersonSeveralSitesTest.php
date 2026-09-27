<?php

namespace ShipFast\LiveEdit\Tests\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\PasswordSignIn;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenAuthenticator;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * One person, one login, several sites.
 *
 * Both directions matter and they are different problems.
 *
 * An agency edits many sites: one person with thirty accounts, thirty
 * passwords and thirty sign-ins is the old shape, and it is unusable for the
 * people who use this product most.
 *
 * And many people edit one site: the agency, plus the client who wants to
 * change their own phone number without asking anybody. That client should
 * get a login to their own site and nothing else — not a view of the
 * agency's other work, and not the agency's own access.
 *
 * What stays scoped is the SESSION. One login is a convenience; one
 * credential that works on every site is a much larger thing to lose.
 */
class OnePersonSeveralSitesTest extends TestCase
{
    private function site(string $slug): Site
    {
        return Site::query()->create([
            'slug' => $slug,
            'name' => ucfirst($slug),
            'allowed_origins' => ['https://'.$slug.'.test'],
        ]);
    }

    private function person(string $email, string $password = 'correct horse battery'): Editor
    {
        $editor = Editor::query()->create(['email' => $email, 'name' => 'Tope']);
        PasswordSignIn::set($editor, $password);

        return $editor->fresh();
    }

    public function test_one_login_works_across_every_site_it_was_given(): void
    {
        $agencyOwner = $this->person('tope@agency.test');
        $first = $this->site('tokreamsblue');
        $second = $this->site('learnkasts');

        $first->editors()->attach($agencyOwner->id, ['may_publish' => true]);
        $second->editors()->attach($agencyOwner->id, ['may_publish' => true]);

        // The same address and the same password, twice. Under the old shape
        // these were two accounts and the second sign-in would fail.
        $this->assertNotNull(PasswordSignIn::attempt($first, 'tope@agency.test', 'correct horse battery'));
        $this->assertNotNull(PasswordSignIn::attempt($second, 'tope@agency.test', 'correct horse battery'));
    }

    public function test_a_session_is_still_only_good_for_the_site_it_was_made_for(): void
    {
        $person = $this->person('tope@agency.test');
        $first = $this->site('tokreamsblue');
        $second = $this->site('learnkasts');

        $first->editors()->attach($person->id, ['may_publish' => true]);
        $second->editors()->attach($person->id, ['may_publish' => true]);

        $result = PasswordSignIn::attempt($first, 'tope@agency.test', 'correct horse battery');

        $auth = new TokenAuthenticator;
        $this->assertTrue($auth->authenticate($result['token'], 'https://tokreamsblue.test', Ability::Write)->passed());

        // Signed in as somebody who genuinely may edit both, and the key
        // still only opens one door.
        $this->assertFalse($auth->authenticate($result['token'], 'https://learnkasts.test', Ability::Write)->passed());
    }

    public function test_a_client_given_their_own_site_cannot_reach_another(): void
    {
        $client = $this->person('owner@tokreamsblue.test');
        $theirs = $this->site('tokreamsblue');
        $somebodyElses = $this->site('learnkasts');

        $theirs->editors()->attach($client->id, ['may_publish' => true]);

        $this->assertNotNull(PasswordSignIn::attempt($theirs, 'owner@tokreamsblue.test', 'correct horse battery'));

        // A real person, a real password, the wrong site. Refused the same
        // way an unknown address is, so trying one is not a way to discover
        // which other sites exist.
        $this->assertNull(PasswordSignIn::attempt($somebodyElses, 'owner@tokreamsblue.test', 'correct horse battery'));
    }

    public function test_publishing_is_decided_per_site(): void
    {
        $person = $this->person('tope@agency.test');
        $trusted = $this->site('tokreamsblue');
        $notYet = $this->site('learnkasts');

        $trusted->editors()->attach($person->id, ['may_publish' => true]);
        $notYet->editors()->attach($person->id, ['may_publish' => false]);

        $auth = new TokenAuthenticator;

        $here = PasswordSignIn::attempt($trusted, 'tope@agency.test', 'correct horse battery');
        $there = PasswordSignIn::attempt($notYet, 'tope@agency.test', 'correct horse battery');

        $this->assertTrue($auth->authenticate($here['token'], 'https://tokreamsblue.test', Ability::Publish)->passed());
        $this->assertFalse($auth->authenticate($there['token'], 'https://learnkasts.test', Ability::Publish)->passed());

        // Still allowed to write there, which is the whole point of the
        // distinction: they may change the words, somebody else decides when
        // the change goes live.
        $this->assertTrue($auth->authenticate($there['token'], 'https://learnkasts.test', Ability::Write)->passed());
    }

    public function test_being_taken_off_one_site_leaves_the_rest_alone(): void
    {
        $person = $this->person('tope@agency.test');
        $kept = $this->site('tokreamsblue');
        $lost = $this->site('learnkasts');

        $kept->editors()->attach($person->id, ['may_publish' => true]);
        $lost->editors()->attach($person->id, ['may_publish' => true]);

        $lost->editors()->detach($person->id);

        $this->assertNull(PasswordSignIn::attempt($lost, 'tope@agency.test', 'correct horse battery'));
        $this->assertNotNull(PasswordSignIn::attempt($kept, 'tope@agency.test', 'correct horse battery'));

        // The account itself survives, password and all. Removing somebody
        // from one client's site must not destroy the login they use for
        // every other client.
        $this->assertNotNull(Editor::query()->find($person->id));
    }

    public function test_when_they_last_edited_is_recorded_against_the_site_they_edited(): void
    {
        $person = $this->person('tope@agency.test');
        $worked = $this->site('tokreamsblue');
        $untouched = $this->site('learnkasts');

        $worked->editors()->attach($person->id, ['may_publish' => true]);
        $untouched->editors()->attach($person->id, ['may_publish' => true]);

        PasswordSignIn::attempt($worked, 'tope@agency.test', 'correct horse battery');

        $this->assertNotNull($worked->editors()->first()->pivot->last_seen_at);

        // "Tope last edited four minutes ago" is only true of the site they
        // edited, and saying it on the other one is simply wrong.
        $this->assertNull($untouched->editors()->first()->pivot->last_seen_at);
    }

    public function test_an_address_nobody_has_ever_heard_of_is_refused_rather_than_exploding(): void
    {
        // This is the line that used to throw. The refusal for an unknown
        // address ran a deliberately slow hash check against a made-up hash,
        // and the made-up one was malformed, so the hasher rejected it and
        // the sign-in form answered 500. A person mistyping their address got
        // a crash, and the crash itself announced that the address was
        // unknown, which is exactly what the slow path exists to hide.
        $site = $this->site('tokreamsblue');

        $this->assertNull(PasswordSignIn::attempt($site, 'nobody@nowhere.test', 'anything at all'));
    }

    public function test_somebody_with_an_account_but_no_password_yet_is_refused_the_same_way(): void
    {
        $editor = Editor::query()->create(['email' => 'invited@agency.test']);
        $site = $this->site('tokreamsblue');
        $site->editors()->attach($editor->id, ['may_publish' => true]);

        $this->assertNull(PasswordSignIn::attempt($site, 'invited@agency.test', 'guessing'));
    }

    public function test_the_same_address_is_the_same_person_however_it_is_typed(): void
    {
        $person = $this->person('tope@agency.test');
        $site = $this->site('tokreamsblue');
        $site->editors()->attach($person->id, ['may_publish' => true]);

        $this->assertNotNull(PasswordSignIn::attempt($site, ' Tope@Agency.test ', 'correct horse battery'));
    }
}
