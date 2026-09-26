<?php

namespace ShipFast\LiveEdit\Tests\WordPress;

use KastsBuild\Builder;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Changing a page builder's own copy of the words, without breaking the page.
 *
 * A builder renders from its store rather than from the markup, so a page
 * built with Elementor has two answers to "what does this heading say" — ours,
 * which wins on every page view, and the builder's, which wins the moment
 * somebody opens the page in it and presses Update. The client's words are
 * gone, weeks later, done by somebody who was not editing text at all.
 *
 * The fix is to keep the two in agreement, which means writing into somebody's
 * page structure. The failure mode of getting that wrong is not a wrong word:
 * it is a page that will not open in the builder again. So the walk that finds
 * and replaces one value is tested on its own, away from WordPress, where the
 * shapes it must refuse can be stated exactly.
 */
class BuilderTreeTest extends TestCase
{
    protected function replace(array $tree, string $id, string $value): array
    {
        require_once __DIR__.'/../../packages/wordpress/kastsbuild/includes/Builder.php';

        $method = new ReflectionMethod(Builder::class, 'replaceIn');
        $method->setAccessible(true);

        $changed = false;
        $out = $method->invokeArgs(null, [$tree, $id, $value, &$changed]);

        return ['tree' => $out, 'changed' => $changed];
    }

    /** The shape Elementor actually stores, trimmed to what matters here. */
    protected function page(): array
    {
        return [[
            'id' => 'sect1',
            'elType' => 'container',
            'elements' => [[
                'id' => 'col1',
                'elType' => 'container',
                'elements' => [
                    ['id' => 'b097460', 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => ['title' => 'Paul Peavey', 'size' => 'xl']],
                    ['id' => '7245fe3', 'elType' => 'widget', 'widgetType' => 'text-editor', 'settings' => ['editor' => '<p>Theme copy</p>']],
                    ['id' => '1e9bf5c', 'elType' => 'widget', 'widgetType' => 'button', 'settings' => ['text' => 'Of Light And Shadow', 'link' => ['url' => '/x']]],
                ],
            ]],
        ]];
    }

    protected function widget(array $tree, string $id): ?array
    {
        $find = function (array $nodes) use (&$find, $id): ?array {
            foreach ($nodes as $node) {
                if (($node['id'] ?? null) === $id) {
                    return $node;
                }

                $deeper = $find($node['elements'] ?? []);

                if ($deeper !== null) {
                    return $deeper;
                }
            }

            return null;
        };

        return $find($tree);
    }

    public function test_it_changes_the_words_on_the_widget_that_was_edited(): void
    {
        $result = $this->replace($this->page(), 'b097460', 'Tope Olotin');

        $this->assertTrue($result['changed']);
        $this->assertSame('Tope Olotin', $this->widget($result['tree'], 'b097460')['settings']['title']);
    }

    public function test_it_leaves_the_rest_of_somebody_s_page_exactly_as_it_was(): void
    {
        // The whole risk in one case. This is their page structure, and the
        // failure of touching the wrong part of it is a page that will not
        // open in the builder again.
        $before = $this->page();
        $after = $this->replace($before, 'b097460', 'Tope Olotin')['tree'];

        $this->assertSame($before[0]['elements'][0]['elements'][1], $this->widget($after, '7245fe3'));
        $this->assertSame($before[0]['elements'][0]['elements'][2], $this->widget($after, '1e9bf5c'));
        $this->assertSame('xl', $this->widget($after, 'b097460')['settings']['size'], 'a setting beside the words was lost');
        $this->assertSame('container', $after[0]['elType']);
    }

    public function test_it_finds_a_widget_however_deeply_it_is_nested(): void
    {
        $this->assertTrue($this->replace($this->page(), '1e9bf5c', 'Listen now')['changed']);
    }

    public function test_it_refuses_a_widget_whose_text_it_does_not_understand(): void
    {
        // An icon box has two pieces of text and a form has a dozen. Guessing
        // which one was meant is how a client's heading ends up in a field
        // nobody was looking at.
        // It has a "title" too, so only the list of widgets we understand
        // stands between us and writing a heading into a widget that uses
        // that field for something else entirely.
        $tree = [[
            'id' => 'unknown1',
            'elType' => 'widget',
            'widgetType' => 'icon-box',
            'settings' => ['title' => 'Lessons', 'title_text' => 'Lessons', 'description_text' => 'Weekly'],
        ]];

        $result = $this->replace($tree, 'unknown1', 'Something else');

        $this->assertFalse($result['changed']);
        $this->assertSame($tree, $result['tree']);
    }

    public function test_it_never_invents_a_field_that_was_not_there(): void
    {
        // Adding one would be inventing structure for a widget we do not
        // really understand, and the builder would have to make sense of it.
        $tree = [['id' => 'h1', 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => ['size' => 'xl']]];

        $result = $this->replace($tree, 'h1', 'New words');

        $this->assertFalse($result['changed']);
        $this->assertArrayNotHasKey('title', $result['tree'][0]['settings']);
    }

    public function test_it_ignores_a_container_that_happens_to_share_the_id(): void
    {
        // Only a widget holds words. Writing a title onto a container would
        // put a setting where the builder does not expect one.
        // Spelled out so that only the elType check can refuse it: a
        // container carrying the same id, the same widgetType and the same
        // field a heading would have. Stored data that has been through
        // several plugin versions does hold shapes like this.
        $tree = [[
            'id' => 'same',
            'elType' => 'container',
            'widgetType' => 'heading',
            'settings' => ['title' => 'not really a heading'],
            'elements' => [],
        ]];

        $result = $this->replace($tree, 'same', 'Nope');

        $this->assertFalse($result['changed']);
        $this->assertSame('not really a heading', $result['tree'][0]['settings']['title']);
    }

    public function test_it_says_nothing_changed_when_the_element_is_not_on_this_page(): void
    {
        $this->assertFalse($this->replace($this->page(), 'not-here', 'Words')['changed']);
    }

    public function test_it_survives_a_tree_with_rubbish_in_it(): void
    {
        // Real stored data from a site that has been through several plugin
        // versions is not always the shape the documentation promises.
        $tree = [null, 'a string', ['id' => 'b097460', 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => ['title' => 'Old']]];

        $result = $this->replace($tree, 'b097460', 'New');

        $this->assertTrue($result['changed']);
        $this->assertSame('New', $result['tree'][2]['settings']['title']);
    }
}
