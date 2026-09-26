<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Content\Companions;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Everybody whose photograph is on this site.
 *
 * Unsplash's terms, and every Creative Commons licence except CC0, ask for the
 * photographer to be named where the work is shown. A bought template has
 * nowhere to put that: it was designed before the picture existed, and adding
 * a caption under somebody's hero is us redesigning a page we were asked to
 * make editable. A credits page is the way out that costs the design nothing
 * and still discharges the obligation.
 *
 * Published values only. An unpublished picture is not on the public site, so
 * naming its photographer there would credit them for something nobody can
 * see, and would leak what the client is still working on.
 */
class ListAttributions
{
    /**
     * @return array{attributions: array<int, array<string, string|null>>, count: int}
     */
    public function __invoke(Site $site): array
    {
        $published = (new SiteStore($site))->published();

        $found = [];

        foreach ($published as $key => $value) {
            if (! str_ends_with($key, 'Credit') || trim((string) $value) === '') {
                continue;
            }

            $picture = substr($key, 0, -strlen('Credit'));

            // The address of the picture itself has to be there, or this is a
            // credit for something that is no longer on the page.
            if (trim((string) ($published[$picture] ?? '')) === '') {
                continue;
            }

            $found[] = [
                'credit' => (string) $value,
                'by' => $this->beside($published, $picture, 'CreditBy'),
                'byUrl' => $this->beside($published, $picture, 'CreditUrl'),
                'source' => $this->beside($published, $picture, 'CreditSource'),
                'sourceUrl' => $this->beside($published, $picture, 'CreditSourceUrl'),
            ];
        }

        /*
         * One line per photographer, not one per picture.
         *
         * A client who uses four photographs by the same person is not asked
         * to thank them four times, and a page that does reads as generated
         * rather than written. Keyed on the sentence because that is what
         * the reader sees; two credits that say the same thing are the same
         * credit however they were stored.
         */
        $unique = [];

        foreach ($found as $one) {
            $unique[$one['credit']] = $one;
        }

        $list = array_values($unique);

        usort($list, fn (array $a, array $b) => strcasecmp((string) $a['by'], (string) $b['by']));

        return ['attributions' => $list, 'count' => count($list)];
    }

    /**
     * @param  array<string, mixed>  $published
     */
    protected function beside(array $published, string $picture, string $suffix): ?string
    {
        // Named from the shared list rather than spelled out, so a companion
        // added later is read here without anybody remembering to come back.
        if (! in_array($suffix, Companions::CREDIT, true)) {
            return null;
        }

        $said = trim((string) ($published[$picture.$suffix] ?? ''));

        return $said === '' ? null : $said;
    }
}
