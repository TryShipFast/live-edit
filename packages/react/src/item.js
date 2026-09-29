import { createContext, createElement, useContext } from 'react';

/**
 * Which row of a list the components inside this one belong to.
 *
 * The thing that makes repeated content work on a real app rather than on an
 * example. React is written with a component boundary in the middle of every
 * list:
 *
 *     {posts.map((post) => <PostPreview key={post.slug} title={post.title} />)}
 *
 * The list is in one file and the words are in another, and no tool reading
 * `post-preview.tsx` can know that component will ever be inside a list. So
 * identity is not passed as a prop and not inferred across files - it is put
 * into context around the row, and picked up at render by whatever turns out
 * to be inside it.
 *
 * That is also what keeps the card honest in both places. The same
 * `PostPreview` used once on its own page composes no identity and behaves as
 * ordinary content; used inside a list it becomes per-row. One component, two
 * correct behaviours, decided where it is rendered rather than where it is
 * written.
 *
 * Renders no DOM. A wrapper element here would sit between a grid and its
 * children and break the layout of every site that installed this - a content
 * tool may not move somebody's design.
 */
const ItemContext = createContext(null);

export const LiveEditItem = ({ id, children }) =>
    createElement(ItemContext.Provider, { value: id ?? null }, children);

/** The row we are inside, or null out in the open. */
export const useItemIdentity = () => useContext(ItemContext);
