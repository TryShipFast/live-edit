<?php

namespace KastsBuild;

/**
 * A page naming everybody whose photograph is on this site.
 *
 * Unsplash's terms, and every Creative Commons licence except CC0, ask for the
 * photographer to be named where the work is shown. A bought template has
 * nowhere to put that. It was designed before the picture existed, and adding
 * a caption under somebody's hero is us redesigning a page we were asked to
 * make editable — which is the one thing this product promises not to do.
 *
 * So the credits live on a page of their own, on the client's own domain,
 * wearing the client's own theme. The obligation is discharged and the design
 * is untouched.
 *
 * Not a real post. A post can be edited, deleted or moved to the bin by
 * somebody tidying up, and then the site is quietly out of compliance with
 * nothing to show it. A route the plugin owns cannot be deleted by accident,
 * and it is right whenever it is asked.
 */
class Credits
{
    public const PATH = 'photo-credits';

    public static function boot(): void
    {
        add_action('init', [self::class, 'route']);
        add_action('template_redirect', [self::class, 'render']);

        // The rewrite rules are cached by WordPress, so a plugin that adds one
        // has to say when they have changed or the new address is a 404 until
        // somebody saves the permalinks page for unrelated reasons.
        register_activation_hook(KASTSBUILD_FILE, function () {
            self::route();
            flush_rewrite_rules();
        });
    }

    public static function route(): void
    {
        add_rewrite_rule('^'.self::PATH.'/?$', 'index.php?kastsbuild_credits=1', 'top');
        add_rewrite_tag('%kastsbuild_credits%', '1');
    }

    public static function url(): string
    {
        return home_url('/'.self::PATH.'/');
    }

    public static function render(): void
    {
        if (get_query_var('kastsbuild_credits') !== '1') {
            return;
        }

        $credits = Api::attributions();

        status_header(200);

        // The theme's own header and footer, so the page belongs to the site
        // rather than looking like something we bolted on.
        get_header();

        echo '<main class="kastsbuild-credits" style="max-width:720px;margin:0 auto;padding:48px 20px;">';
        echo '<h1>'.esc_html__('Photo credits', 'kastsbuild').'</h1>';

        if ($credits === []) {
            echo '<p>'.esc_html__('No photographs on this site need a credit.', 'kastsbuild').'</p>';
        } else {
            echo '<p>'.esc_html__('Thank you to the photographers whose work appears on this site.', 'kastsbuild').'</p>';
            echo '<ul style="line-height:2;list-style:none;padding:0;">';

            foreach ($credits as $credit) {
                echo '<li>'.self::line($credit).'</li>';
            }

            echo '</ul>';
        }

        echo '</main>';

        get_footer();
        exit;
    }

    /**
     * One credit, with the links the licence asks for.
     *
     * Built from the parts rather than printing a stored sentence, because a
     * stored sentence would have to be trusted as markup and it comes from
     * another service. Every piece is escaped on the way out.
     *
     * @param  array<string, string|null>  $credit
     */
    private static function line(array $credit): string
    {
        $by = $credit['by'] ?? null;
        $source = $credit['source'] ?? null;

        if ($by === null) {
            return esc_html((string) ($credit['credit'] ?? ''));
        }

        $name = $credit['byUrl']
            ? '<a href="'.esc_url($credit['byUrl']).'" rel="nofollow noopener" target="_blank">'.esc_html($by).'</a>'
            : esc_html($by);

        if ($source === null) {
            return sprintf(esc_html__('Photo by %s', 'kastsbuild'), $name);
        }

        $where = $credit['sourceUrl']
            ? '<a href="'.esc_url($credit['sourceUrl']).'" rel="nofollow noopener" target="_blank">'.esc_html($source).'</a>'
            : esc_html($source);

        return sprintf(esc_html__('Photo by %1$s on %2$s', 'kastsbuild'), $name, $where);
    }
}
