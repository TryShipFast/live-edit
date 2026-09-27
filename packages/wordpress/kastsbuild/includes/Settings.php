<?php

namespace KastsBuild;

/**
 * Where the site's keys live.
 *
 * The secret key is stored like any other option, which means it is readable
 * by anyone who can already read the database or reach this screen — the same
 * footing as every other credential WordPress holds. What matters is that it
 * is never printed into a page: the screen shows only that it is set, and the
 * front end receives a short-lived session instead.
 */
class Settings
{
    private const OPTION = 'kastsbuild_settings';

    public static function boot(): void
    {
        add_action('admin_menu', [self::class, 'menu']);
        add_action('admin_init', [self::class, 'register']);
    }

    public static function menu(): void
    {
        add_options_page('KastsBuild Live Edit', 'Live Edit', 'manage_options', 'kastsbuild', [self::class, 'screen']);
    }

    public static function register(): void
    {
        register_setting('kastsbuild', self::OPTION, [
            'sanitize_callback' => [self::class, 'sanitise'],
            'default' => [],
        ]);
    }

    /** @param mixed $input */
    public static function sanitise($input): array
    {
        $existing = self::all();
        $clean = [
            'site' => sanitize_text_field($input['site'] ?? ''),
            'api_base' => esc_url_raw($input['api_base'] ?? ''),
            'sign_in' => in_array($input['sign_in'] ?? '', ['wp', 'service', 'either'], true)
                ? $input['sign_in']
                : 'either',
            'verification' => sanitize_text_field($input['verification'] ?? ''),
            'publishable_key' => sanitize_text_field($input['publishable_key'] ?? ''),
            'capability' => sanitize_text_field($input['capability'] ?? 'edit_theme_options'),
        ];

        // An empty box means "leave it alone", not "delete it". Otherwise
        // saving any other field would silently wipe the secret, and the site
        // would stop editing for a reason nobody could see.
        $secret = trim((string) ($input['secret_key'] ?? ''));
        $clean['secret_key'] = $secret !== '' ? $secret : ($existing['secret_key'] ?? '');

        delete_transient('kastsbuild_stamp');

        return $clean;
    }

    public static function all(): array
    {
        $stored = get_option(self::OPTION, []);

        return is_array($stored) ? $stored : [];
    }

    public static function get(string $key, string $default = ''): string
    {
        return (string) (self::all()[$key] ?? $default);
    }

    /**
     * Which doors are open: 'wp', 'service', or 'either'.
     *
     * Either by default, because it is the only value that cannot lock
     * somebody out of a site that was working yesterday.
     */
    public static function signIn(): string
    {
        $value = self::get('sign_in', 'either');

        return in_array($value, ['wp', 'service', 'either'], true) ? $value : 'either';
    }

    /**
     * The WordPress capability that means somebody may edit the words.
     *
     * Defaults to this plugin's own, which activation grants to
     * administrators and which a site owner can grant to anybody else without
     * handing over the rest of wp-admin along with it.
     *
     * A site that had set edit_theme_options keeps it: the stored value wins,
     * and an upgrade that silently changed who may edit would be a security
     * decision made on somebody's behalf.
     */
    public static function capability(): string
    {
        return self::get('capability', 'kastsbuild_edit') ?: 'kastsbuild_edit';
    }

    public static function configured(): bool
    {
        return self::get('site') !== '' && self::get('api_base') !== '';
    }

    public static function screen(): void
    {
        if (! current_user_can('manage_options')) {
            return;
        }

        $s = self::all();
        $hasSecret = ($s['secret_key'] ?? '') !== '';
        ?>
        <div class="wrap">
            <h1>Live Edit</h1>
            <p>Lets the people who own this site change the words and pictures in their theme, in the page itself.</p>
            <form method="post" action="options.php">
                <?php settings_fields('kastsbuild'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="kb-site">Site ID</label></th>
                        <td><input name="kastsbuild_settings[site]" id="kb-site" type="text" class="regular-text"
                                   value="<?php echo esc_attr($s['site'] ?? ''); ?>">
                            <p class="description">From your dashboard. The site these keys belong to.</p></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-base">API address</label></th>
                        <td><input name="kastsbuild_settings[api_base]" id="kb-base" type="url" class="regular-text"
                                   value="<?php echo esc_attr($s['api_base'] ?? ''); ?>"
                                   placeholder="https://cms.example.com/api/live-edit/v1"></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-pub">App key</label></th>
                        <td><input name="kastsbuild_settings[publishable_key]" id="kb-pub" type="text" class="regular-text"
                                   value="<?php echo esc_attr($s['publishable_key'] ?? ''); ?>" placeholder="kbp_…">
                            <p class="description">Public. It goes into every page this site serves, so it is not a secret and is safe there.</p></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-sec">Secret key</label></th>
                        <td><input name="kastsbuild_settings[secret_key]" id="kb-sec" type="password" class="regular-text"
                                   value="" placeholder="<?php echo $hasSecret ? 'Saved — leave blank to keep it' : 'kbs_…'; ?>">
                            <p class="description">Stays on this server. Never sent to a browser, and never shown again here.</p></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-verify">Verification code</label></th>
                        <td><input name="kastsbuild_settings[verification]" id="kb-verify" type="text" class="regular-text"
                                   value="<?php echo esc_attr($s['verification'] ?? ''); ?>" placeholder="shipfast-verify-…">
                            <p class="description">
                                From your dashboard, to prove you own this domain. Paste it here and this plugin puts
                                it in your home page for you, then press Verify in the dashboard. Nothing to edit in
                                your theme.
                            </p></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-signin">Where editors sign in</label></th>
                        <td>
                            <?php $signIn = self::signIn(); ?>
                            <select name="kastsbuild_settings[sign_in]" id="kb-signin">
                                <option value="either" <?php selected($signIn, 'either'); ?>>Either</option>
                                <option value="wp" <?php selected($signIn, 'wp'); ?>>WordPress only</option>
                                <option value="service" <?php selected($signIn, 'service'); ?>>Live Edit only</option>
                            </select>
                            <p class="description">
                                WordPress accounts are the usual answer. Choose Live Edit for people who should be
                                able to change words without an account here at all, which spares you handing out
                                wp-admin to everybody who writes a sentence.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="kb-cap">Who may edit</label></th>
                        <td><input name="kastsbuild_settings[capability]" id="kb-cap" type="text" class="regular-text"
                                   value="<?php echo esc_attr($s['capability'] ?? self::capability()); ?>">
                            <p class="description">
                                A WordPress capability, used when they sign in with WordPress.
                                <code>kastsbuild_edit</code> is this plugin's own and means only "may edit the words";
                                administrators have it. <code>edit_theme_options</code> means administrators and
                                everything else they can do.
                            </p></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
