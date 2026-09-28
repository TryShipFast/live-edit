<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Support\Str;

/**
 * Whether a host is somebody's own machine rather than a website on the
 * internet.
 *
 * The question matters because of what a licence is for. One licence covers
 * one website, and the allow-list of addresses the editor may be used from is
 * the obvious way around that: add a second live domain and run the editor on
 * two sites for the price of one. What stops that is refusing a browser whose
 * address is not the licensed one.
 *
 * Except somebody installing the plugin has to try it somewhere first, and
 * that somewhere is a local address. So the rule cannot simply be "the
 * licensed domain and nothing else" without making the product impossible to
 * install.
 *
 * These hosts are the exception, and they are safe to allow without limit for
 * a reason that does not depend on trusting anybody: none of them can be a
 * website on the internet.
 *
 *   - Loopback resolves to the machine asking. Nobody else can reach it.
 *   - .test, .localhost, .invalid and .example are reserved by the IANA
 *     precisely so they can never be registered (RFC 2606, RFC 6761). Laravel
 *     Herd and Valet serve local sites at .test, which is why "localhost" on
 *     its own is not enough.
 *   - .local is mDNS, for a name on the network in front of you.
 *
 * A customer cannot smuggle a second business onto a licence through any of
 * them, because a second business cannot be served from any of them.
 */
final class LocalAddress
{
    /** @var array<int, string> */
    private const RESERVED_SUFFIXES = ['.test', '.localhost', '.local', '.invalid', '.example'];

    /** @var array<int, string> */
    private const LOOPBACK = ['localhost', '127.0.0.1', '::1', '0.0.0.0', '[::1]'];

    public static function is(?string $host): bool
    {
        $host = self::hostOf($host);

        if ($host === '') {
            return false;
        }

        if (in_array($host, self::LOOPBACK, true)) {
            return true;
        }

        /*
         * Anything in 127.0.0.0/8, which is all loopback rather than just
         * .0.1, and only when the whole host is an address.
         *
         * Matching the prefix "127." was the first version, and
         * 127.0.0.1.evil.com is a domain somebody can register. A test caught
         * it. That is the shape of every bypass here: a string that starts or
         * ends like a safe thing and is a public website.
         */
        if (filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
            return Str::startsWith($host, '127.');
        }

        /*
         * A reserved suffix, and the dot matters. "greatest.com" ends in
         * "test" and "localhost.com" starts with one, and both are ordinary
         * websites somebody can buy.
         */
        foreach (self::RESERVED_SUFFIXES as $suffix) {
            if (Str::endsWith($host, $suffix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The host out of anything somebody might have typed: a bare host, an
     * origin with a scheme, a port, a trailing slash.
     */
    private static function hostOf(?string $value): string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        if (! str_contains($value, '//')) {
            $value = 'https://'.$value;
        }

        $host = parse_url($value, PHP_URL_HOST) ?: '';

        return Str::lower(trim($host, '.[]'));
    }
}
