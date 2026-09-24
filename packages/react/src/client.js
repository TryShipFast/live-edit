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

export const createClient = ({ apiBase, site, key }) => {
    const root = `${String(apiBase).replace(/\/$/, '')}/${site}`;

    const call = async (path, options = {}) => {
        const response = await fetch(`${root}${path}`, {
            ...options,
            headers: {
                // The caller's headers go first so they cannot replace these:
                // losing the key turns every save into an anonymous request.
                ...(options.headers ?? {}),
                Authorization: `Bearer ${key}`,
                Accept: 'application/json',
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            },
        });

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
        read: (locale) => call(`/content${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
        write: (key_, value, locale) =>
            call('/content', { method: 'POST', body: JSON.stringify({ key: key_, value, locale }) }),
    };
};
