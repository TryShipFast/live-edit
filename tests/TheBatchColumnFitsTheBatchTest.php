<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Support\OneAction;

/**
 * The batch id has to fit the column it is written to.
 *
 * It stopped being a uuid and the column did not hear about it. Undo on the
 * service needs to know which site and which token an action belonged to, so a
 * batch became "api:<site>:<token>:<uuid>" - 68 characters for a ten-letter
 * site - going into the char(36) that `uuid('batch')` creates. Every save
 * through the API failed with "1406 Data too long". Not the picture endpoint:
 * every save, on every cloud site, text included.
 *
 * It passed 746 tests because they run on SQLite, which records a column's
 * declared length and does not enforce it. So a functional test cannot catch
 * this however many there are - the only thing that can is comparing the
 * length the code produces against the length the schema declares, which is
 * what this does. That comparison works on SQLite precisely because the
 * declared length is still there to read.
 *
 * The register has an entry about running migrations against MySQL, from a
 * deploy that failed twice for exactly this reason. This was the third time,
 * and the previous two were found by deploying.
 */
class TheBatchColumnFitsTheBatchTest extends TestCase
{
    /**
     * What every migration declares for this column, in characters.
     *
     * Read from the migrations and not from the database, which sounds
     * backwards and is the only thing that works. SQLite does not record a
     * varchar's length - the table it creates says `"batch" varchar not null`,
     * with no size anywhere - so no test running on it can ask the schema how
     * wide the column is. Whatever is written there fits, always, which is
     * exactly why this shipped.
     *
     * The migrations are where the mistake was: `uuid('batch')`, which is
     * char(36), for a value of 68. That much is readable anywhere.
     *
     * @return array<string, int>  file => declared length
     */
    private function declaredIn(): array
    {
        $found = [];

        foreach (glob(__DIR__.'/../database/migrations/*.php') as $file) {
            $source = (string) file_get_contents($file);

            foreach (['batch'] as $column) {
                if (preg_match('/->uuid\(\s*[\'"]'.$column.'[\'"]\s*\)/', $source)) {
                    // char(36), and said in a way that does not look like a
                    // length at all, which is half of why it was missed.
                    $found[basename($file)] = 36;

                    continue;
                }

                if (preg_match('/->string\(\s*[\'"]'.$column.'[\'"]\s*,\s*(\d+)\s*\)/', $source, $size)) {
                    $found[basename($file)] = (int) $size[1];

                    continue;
                }

                // Named rather than written out, so the column and the value
                // cannot drift apart again. That drift is the whole bug.
                if (preg_match('/->string\(\s*[\'"]'.$column.'[\'"]\s*,\s*OneAction::FITS\s*\)/', $source)) {
                    $found[basename($file)] = OneAction::FITS;

                    continue;
                }

                if (preg_match('/->string\(\s*[\'"]'.$column.'[\'"]\s*\)/', $source)) {
                    // Laravel's default string length.
                    $found[basename($file)] = 255;
                }
            }
        }

        $this->assertNotEmpty($found, 'no migration declares a batch column');

        return $found;
    }

    public function test_the_longest_batch_the_code_can_make_fits(): void
    {
        /*
         * Built from the real function, not from a copy of its format. A test
         * holding its own idea of what a batch looks like agrees with itself
         * forever and says nothing about the code.
         */
        $longest = OneAction::by(str_repeat('a', 63), str_repeat('b', 40));

        $this->assertLessThanOrEqual(
            OneAction::FITS,
            strlen($longest),
            'a batch of '.strlen($longest).' characters is written to a column of '
            .OneAction::FITS.'. On MySQL that is 1406 Data too long and every save fails.'
        );
    }

    public function test_the_last_word_on_the_column_is_wide_enough_for_it(): void
    {
        // Whichever migration speaks last decides the column, and it has to
        // agree with the constant the code is measured against.
        $declared = $this->declaredIn();

        $this->assertGreaterThanOrEqual(
            OneAction::FITS,
            (int) end($declared),
            'the column ends up narrower than OneAction::FITS, so a batch the code '
            .'happily produces will not fit: '.json_encode($declared)
        );
    }

    public function test_an_ordinary_batch_is_no_longer_a_uuid(): void
    {
        // The case that actually broke, at the real sizes: a ten-letter slug
        // and a sixteen-character token id, into char(36).
        $real = OneAction::by('learnkasts', '171df69c8e82f7e2');

        $this->assertGreaterThan(36, strlen($real), 'a uuid column would have been fine, and this is not a uuid');
        $this->assertLessThanOrEqual(OneAction::FITS, strlen($real));
    }

    public function test_the_column_is_still_indexable(): void
    {
        /*
         * 191 is the longest utf8mb4 string MySQL will index under the old
         * 767-byte key limit, and this column is indexed - the weekly digest
         * counts a site's edits with "batch like api:<slug>:%". Widening past
         * that trades a working index for headroom nobody needs.
         */
        $this->assertLessThanOrEqual(191, OneAction::FITS);
    }
}
