/**
 * How the editor overlay reaches React.
 *
 * The overlay is framework-agnostic and knows only about DOM nodes and keys —
 * which is what lets one editor serve every adapter. It cannot know that this
 * particular page will throw its changes away on the next render. So the
 * provider leaves a way in, and the overlay uses it when it is there.
 *
 * A global is the right shape here despite the usual objection: the overlay is
 * loaded as a separate script by a host we do not control, so a module import
 * is not available to it. It is namespaced and written once.
 */
export const BRIDGE_KEY = '__liveEditReact';

export const publishBridge = (bridge) => {
    if (typeof window === 'undefined') {
        return () => {};
    }

    window[BRIDGE_KEY] = bridge;

    // Announced, because the overlay may have loaded first and given up
    // looking. Without this the editor works after a refresh and not before,
    // which reads as flakiness.
    window.dispatchEvent(new CustomEvent('live-edit:react-ready'));

    return () => {
        if (window[BRIDGE_KEY] === bridge) {
            delete window[BRIDGE_KEY];
        }
    };
};

export const readBridge = () => (typeof window === 'undefined' ? null : window[BRIDGE_KEY] ?? null);
