<?php

namespace ShipFast\LiveEdit\Http\Api;

use Illuminate\Http\Request;
use RuntimeException;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * The authenticated caller, carried on the request.
 *
 * Deliberately not a global or a container singleton: an API handles one
 * request at a time under FPM but not under a long-lived worker, and a site
 * left behind in a singleton is one customer's key acting on another's content.
 */
final class ApiContext
{
    private const KEY = 'live-edit.api.context';

    public static function set(Request $request, ApiToken $token, Site $site): void
    {
        $request->attributes->set(self::KEY, ['token' => $token, 'site' => $site]);
    }

    public static function site(Request $request): Site
    {
        return self::get($request)['site'];
    }

    public static function token(Request $request): ApiToken
    {
        return self::get($request)['token'];
    }

    public static function has(Request $request): bool
    {
        return $request->attributes->has(self::KEY);
    }

    /** @return array{token: ApiToken, site: Site} */
    private static function get(Request $request): array
    {
        $context = $request->attributes->get(self::KEY);

        if ($context === null) {
            // Reaching here means a route was mounted without authentication.
            // Failing loudly is the only safe reading: the alternative is
            // serving somebody's content to an unauthenticated caller.
            throw new RuntimeException('No authenticated site on this request. Is the route behind live-edit.auth?');
        }

        return $context;
    }
}
