/**
 * Talking to the content API.
 *
 * Deliberately small and dependency-free: this runs inside somebody else's
 * application, and a content editor is not a good reason to add weight to
 * their bundle or opinions to their build.
 */

const json = async (response) => {
    // A redirect to a login page is a 200 with HTML, and reading that as
    // success is how a save silently does nothing.
    const type = response.headers.get('content-type') ?? '';
    if (!type.includes('json')) {
        throw new Error(`Expected JSON from the content API, got ${type || 'nothing'}`);
    }
    return response.json();
};

/**
 * How long a call is given before it is treated as failed.
 *
 * fetch waits forever, and on a server-rendered page forever is not an
 * inconvenience - it is a held connection. A page whose content call hangs
 * never finishes rendering, so the visitor waits on whatever the host's own
 * timeout turns out to be, and under any load the worker pool fills with
 * requests waiting on us.
 *
 * Reported against 0.13.5: no AbortSignal or AbortController anywhere in this
 * package. Correct, and this is the one place that needed it - every read and
 * every write goes through the call below.
 */
export const WAITS_AT_MOST = 10000;

const givesUpAfter = (ms) => {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }

    if (typeof AbortController === 'undefined') {
        return undefined;
    }

    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);

    return controller.signal;
};

export const createClient = ({ apiBase, site, key, timeout = WAITS_AT_MOST }) => {
    const root = `${String(apiBase).replace(/\/$/, '')}/${site}`;

    const call = async (path, options = {}) => {
        let response;

        try {
            response = await fetch(`${root}${path}`, {
                ...options,
                // A caller may pass its own, and an explicit one is honoured:
                // a build fetching every page's content has different patience
                // from a visitor waiting on one.
                signal: options.signal ?? givesUpAfter(timeout),
                headers: {
                    // The caller's headers go first so they cannot replace
                    // these: losing the key turns every save into an anonymous
                    // request.
                    ...(options.headers ?? {}),
                    Authorization: `Bearer ${key}`,
                    Accept: 'application/json',
                    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                },
            });
        } catch (cause) {
            if (cause?.name !== 'TimeoutError' && cause?.name !== 'AbortError') {
                throw cause;
            }

            // Named as a timeout rather than left as "aborted", so a host
            // whose page is slow can tell our call from their own code.
            const error = new Error(`The content API did not answer within ${timeout}ms`);
            error.status = 408;
            error.timedOut = true;

            throw error;
        }

        if (response.status === 304) {
            return null;
        }

        if (!response.ok) {
            const body = await json(response).catch(() => ({}));
            const error = new Error(body?.error?.message ?? `Content API returned ${response.status}`);
            error.status = response.status;
            error.retryAfter = Number(response.headers.get('Retry-After')) || null;
            throw error;
        }

        return json(response);
    };

    return {
        read: (locale, init = {}) =>
            call(`/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`, init),
        write: (key_, value, locale) =>
            call('/content', { method: 'POST', body: JSON.stringify({ key: key_, value, locale }) }),
    };
};
