<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Content;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Which held changes the Changes tab should show as one.
 *
 * Replacing a photograph writes the address, the description, the tooltip and
 * four fields of credit, each its own setting so a theme can read them by
 * name. Seven rows for one thing somebody did. Listed separately they bury
 * everything else in the list, and "Photo by Caio Silva on Unsplash" is not a
 * change anybody made on purpose or would know how to revert.
 *
 * The rule has to fold them without swallowing a change somebody did make on
 * purpose: editing only a picture's alt text is a real edit, and hiding it as
 * the companion of a change that is not happening leaves the client looking at
 * a list that says nothing happened.
 *
 * Tested away from WordPress, because the rule is arithmetic on key names and
 * the database has nothing to say about it.
 */
class ChangeListTest extends TestCase
{
    protected function hidden(string $key, array $drafts): bool
    {
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Content.php';

        $method = new ReflectionMethod(Content::class, 'belongsToAPicture');
        $method->setAccessible(true);

        return (bool) $method->invokeArgs(null, [$key, $drafts]);
    }

    public function test_a_picture_and_its_companions_are_one_change(): void
    {
        $drafts = [
            'auto:abc123' => 'https://example.test/new.jpg',
            'auto:abc123Alt' => 'A guitar in the shop',
            'auto:abc123Credit' => '',
            'auto:abc123CreditBy' => '',
        ];

        $this->assertFalse($this->hidden('auto:abc123', $drafts), 'the picture itself is the change');
        $this->assertTrue($this->hidden('auto:abc123Alt', $drafts));
        $this->assertTrue($this->hidden('auto:abc123Credit', $drafts));
        $this->assertTrue($this->hidden('auto:abc123CreditBy', $drafts));
    }

    public function test_alt_text_edited_on_its_own_is_a_change_of_its_own(): void
    {
        // The picture is not changing, so there is nothing for this to be a
        // companion of. Hidden anyway, the client sees an empty list after
        // doing real work - and alt text is the edit a site owner is most
        // likely to make without touching the photograph.
        $this->assertFalse($this->hidden('auto:abc123Alt', ['auto:abc123Alt' => 'Describes the picture']));
    }

    public function test_a_sentence_that_happens_to_end_in_a_companion_word_is_not_folded_away(): void
    {
        // Nothing named 'auto:headingTitle' is a companion unless something
        // named 'auto:heading' is also being changed.
        $this->assertFalse($this->hidden('auto:headingTitle', ['auto:headingTitle' => 'Our Work']));

        $this->assertTrue($this->hidden('auto:headingTitle', [
            'auto:heading' => 'https://example.test/x.jpg',
            'auto:headingTitle' => 'Our Work',
        ]));
    }

    public function test_ordinary_text_is_never_folded(): void
    {
        $this->assertFalse($this->hidden('auto:77f95d93de5e', [
            'auto:77f95d93de5e' => 'We build guitars',
            'auto:9de57a6dba8b' => 'Tope Olotin',
        ]));
    }
}
