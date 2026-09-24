<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Support\SvgSanitiser;

/**
 * An icon is the only thing the editor stores that is markup rather than text,
 * so it is the only place a stored value could become code.
 */
class SvgSanitiserTest extends TestCase
{
    public function test_it_keeps_a_drawing_intact(): void
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">'
            .'<path d="M5 12h14" stroke-width="2"/><circle cx="12" cy="12" r="9"/></svg>';

        $clean = SvgSanitiser::clean($svg);

        $this->assertStringContainsString('<path', $clean);
        $this->assertStringContainsString('d="M5 12h14"', $clean);
        $this->assertStringContainsString('viewBox="0 0 24 24"', $clean);
        $this->assertStringContainsString('<circle', $clean);
    }

    public function test_it_drops_a_script(): void
    {
        $clean = SvgSanitiser::clean('<svg><script>alert(1)</script><path d="M0 0"/></svg>');

        $this->assertStringNotContainsString('script', $clean);
        $this->assertStringNotContainsString('alert', $clean);
        $this->assertStringContainsString('<path', $clean);
    }

    public function test_it_drops_event_handlers(): void
    {
        $clean = SvgSanitiser::clean('<svg onload="alert(1)"><path d="M0 0" onclick="steal()"/></svg>');

        $this->assertStringNotContainsString('onload', $clean);
        $this->assertStringNotContainsString('onclick', $clean);
        $this->assertStringNotContainsString('alert', $clean);
    }

    public function test_it_drops_foreign_content_that_can_run_or_fetch(): void
    {
        $svg = '<svg><foreignObject><iframe src="https://evil.test"></iframe></foreignObject>'
            .'<image href="https://evil.test/track.png"/><path d="M0 0"/></svg>';

        $clean = SvgSanitiser::clean($svg);

        $this->assertStringNotContainsString('foreignObject', $clean);
        $this->assertStringNotContainsString('iframe', $clean);
        $this->assertStringNotContainsString('evil.test', $clean);
        $this->assertStringContainsString('<path', $clean);
    }

    public function test_a_reference_may_point_inside_the_drawing_and_nowhere_else(): void
    {
        $inside = SvgSanitiser::clean('<svg><use href="#shape"/><path id="shape" d="M0 0"/></svg>');
        $this->assertStringContainsString('href="#shape"', $inside);

        $outside = SvgSanitiser::clean('<svg><use href="https://evil.test/x.svg#a"/><path d="M0 0"/></svg>');
        $this->assertStringNotContainsString('evil.test', $outside);
    }

    public function test_a_presentation_attribute_cannot_fetch(): void
    {
        $remote = SvgSanitiser::clean('<svg><path d="M0 0" fill="url(https://evil.test/x)"/></svg>');
        $this->assertStringNotContainsString('evil.test', $remote);

        $local = SvgSanitiser::clean('<svg><defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs>'
            .'<path d="M0 0" fill="url(#g)"/></svg>');
        $this->assertStringContainsString('url(#g)', $local);
    }

    public function test_it_drops_animation_which_can_set_any_attribute(): void
    {
        $clean = SvgSanitiser::clean('<svg><path d="M0 0"><animate attributeName="href" to="javascript:alert(1)"/></path></svg>');

        $this->assertStringNotContainsString('animate', $clean);
        $this->assertStringNotContainsString('javascript:', $clean);
    }

    public function test_it_refuses_anything_that_is_not_a_drawing(): void
    {
        $this->assertSame('', SvgSanitiser::clean('<div>not an svg</div>'));
        $this->assertSame('', SvgSanitiser::clean(''));
        $this->assertSame('', SvgSanitiser::clean('<svg></svg>'));
        $this->assertSame('', SvgSanitiser::clean('<svg><script>alert(1)</script></svg>'));
    }

    public function test_it_survives_a_malformed_fragment(): void
    {
        $this->assertIsString(SvgSanitiser::clean('<svg><path d="M0 0"'));
        $this->assertIsString(SvgSanitiser::clean('<<svg>>'));
    }
}
