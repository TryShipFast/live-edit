<?php

namespace ShipFast\LiveEdit\Mapper;

/**
 * The same tree the browser has, before anything is keyed against it.
 *
 * A nested `<a>` is invalid HTML, and a browser does not merely tolerate it -
 * it rebuilds the tree. The adoption agency algorithm splits the misnested
 * anchor and repeats it around each block it contained, so
 *
 *     <a class="card"><div><p>Words</p><div><a>Enrol</a></div></div></a>
 *
 * becomes four anchors in Chrome and stays two in libxml. That mattered far
 * beyond clicking: auto keys are a hash of where an element sits, so a page
 * tagged on the server was keyed against a tree no browser would ever have,
 * and the browser then looked for elements that were not where anything
 * expected. Saves came back as "Unknown setting" for keys the server had never
 * recorded. Met on a live catalogue page, which is where the money is.
 *
 * It was written down as unfixable, on the reasoning that we do not control
 * the parser. PHP 8.4 changed that: `Dom\HTMLDocument` implements HTML5 tree
 * construction properly. (`masterminds/html5` was tried first as the portable
 * option and gives libxml's wrong answer, so it is no help.)
 *
 * The trick here is that nothing downstream has to change. The document is
 * parsed by the spec parser and written straight back out, and the split is
 * structural - four separate anchors in the markup - so it survives being
 * handed to libxml afterwards. One normalising step, and every type hint,
 * every XPath and every key rule below carries on as it was.
 *
 * Silently does nothing on PHP 8.3, where the class does not exist. A site
 * there keeps exactly the behaviour it has today rather than getting a third
 * one.
 */
final class TheTreeABrowserBuilds
{
    public static function available(): bool
    {
        return class_exists(\Dom\HTMLDocument::class);
    }

    /**
     * Rewrite a fragment as the browser would have built it.
     *
     * Returns the input untouched when the spec parser is absent, or when it
     * cannot make sense of what it was given - a normaliser that throws away a
     * page it did not understand would be worse than the fault it fixes.
     */
    public static function from(string $html): string
    {
        if ($html === '' || ! self::available()) {
            return $html;
        }

        try {
            /*
             * A whole document and a fragment need different handling, and
             * getting that wrong is not subtle. Wrapping a full page in
             * another <body> makes the parser reconcile two of them, and it
             * resolves that by pulling the real content up into <head> - a
             * page silently turned inside out. Two tests caught it.
             */
            $whole = (bool) preg_match('/<html[\s>]/i', $html);

            $document = \Dom\HTMLDocument::createFromString(
                $whole ? $html : '<!DOCTYPE html><html><body>'.$html.'</body></html>',
                // LIBXML_NOERROR only. The HTML5 parser rejects flags libxml
                // accepts - NOWARNING among them - and rejects them by
                // throwing, which the guard below turns into a silent no-op.
                // It did exactly that until this was measured.
                LIBXML_NOERROR
            );

            if ($whole) {
                $out = $document->saveHtml();

                return trim($out) === '' ? $html : $out;
            }

            $body = $document->body;

            if ($body === null) {
                return $html;
            }

            $inner = '';

            foreach ($body->childNodes as $child) {
                $inner .= $document->saveHtml($child);
            }

            // An empty result from non-empty input means it read the page as
            // nothing. Keep what we were given.
            return trim($inner) === '' ? $html : $inner;
        } catch (\Throwable) {
            return $html;
        }
    }
}
