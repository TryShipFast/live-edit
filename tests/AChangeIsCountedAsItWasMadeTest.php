<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Domain\Content\ChangesAsMade;

/**
 * "Publish 18 changes" for six things done: a palette chosen in Brand is seven values, a pairing of fonts two
 * (first-time owner walk, 7 Nov 2026). Each counts once.
 */
class AChangeIsCountedAsItWasMadeTest extends TestCase
{
    public function test_a_palette_and_a_pairing_each_count_once(): void
    {
        $this->assertSame(4, ChangesAsMade::count([
            'tpl:heading', ...ChangesAsMade::COLOURS, 'tpl:photo', 'brand.font.display', 'brand.font.body',
        ]));
    }

    public function test_everything_else_counts_as_it_is(): void
    {
        $this->assertSame(3, ChangesAsMade::count(['brand.name', 'brand.phone', 'auto:1a2b3c']));
        $this->assertSame(0, ChangesAsMade::count([]));
    }
}
