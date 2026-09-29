import { useContent } from './useContent.js';

/**
 * One editable value, as a component rather than a hook call.
 *
 * Outside a list the codemod rewrites words to `{useContent(key, "...")}`,
 * inline in the JSX, and that is the right shape there: one element, one hook
 * call, in the same order on every render.
 *
 * It cannot be the shape inside a `.map()`. React's hook state is positional -
 * it matches calls to slots by the order they happen - so the number of hook
 * calls a component makes has to be the same every render. `items.map(item =>
 * useContent(...))` makes one call per row, so a list that gains or loses a row
 * shifts every hook after it onto the wrong slot. That is not a lint
 * preference; it is the reason the Rules of Hooks exist, and the corruption is
 * silent and arbitrary.
 *
 * A component has no such problem. Each element rendered from a `.map()` is
 * its own component instance with its own hook slots, so calling a hook once
 * inside it is calling it once - however many rows there are.
 *
 * Renders no element of its own. It returns the string, so the markup a
 * designer wrote is the markup a visitor gets: a wrapper here would change the
 * CSS of every list item on every site using it.
 *
 * @see ADAPTERS.md, "The React repeated-content milestone"
 */
export const LiveEditText = ({ contentKey, fallback = '' }) => useContent(contentKey, fallback);

/*
 * The prop is `contentKey` and cannot be `key`. React takes `key` for itself:
 * it is read off the element and never reaches the component, so a value
 * passed as `key` would arrive as undefined and every row would render its
 * fallback forever - looking exactly like content that failed to load.
 */
