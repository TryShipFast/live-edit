/**
 * Deciding which of a panel's fields are worth sending.
 *
 * A drawer holds every field a picture can have and submits all of them, and
 * most of them hold the value that was already on the page. One picture
 * replaced wrote nine rows: the picture, the description it already had, five
 * empty credit fields, an empty tooltip and an empty set of style props. The
 * customer read "9 changes" on the publish button for one replaced picture and
 * said so, which is how this was found.
 *
 * Three costs, not one. The count is wrong at the moment somebody is deciding
 * whether to publish; the version history fills with rows that changed
 * nothing, so the row that did is buried - which is why reverting a picture
 * felt impossible; and every row is metered as a write, so replacing one
 * picture is billed nine times.
 *
 * The store refuses a write that matches what it already holds, which covers
 * every client and every second save. What it cannot know is the page: an
 * empty credit where nothing is stored, or a description that came from the
 * markup rather than from us, both look like new information from there. Only
 * the panel knows they were never typed. So that half lives here - pulled out
 * of the editor, because a decision inside a four-thousand-line closure is a
 * decision nobody can test.
 */

/**
 * The credit fields that actually say something.
 *
 * A picture from the stock picker carries all six whether or not the
 * photographer supplied them. An absent credit and an empty one mean the same
 * thing to every reader of the page, so storing five empty strings buys five
 * changes and no information.
 *
 * @param  {Record<string, string>|null|undefined} credit
 * @returns {Array<[string, string]>}
 */
export const creditWorthSending = (credit) => Object.entries(credit ?? {})
    .filter(([, said]) => String(said ?? '') !== '');

/**
 * The text fields somebody actually typed in.
 *
 * Compared against what the field said when the panel opened, which is the
 * only thing that distinguishes a description somebody wrote from one the
 * panel read off the page and handed back unchanged.
 *
 * Deliberately not "is it empty": clearing a description that came from the
 * markup is a real intention, and the store cannot tell that from a field
 * nobody touched because nothing was ever written for that key.
 *
 * @param  {Array<{value: string, dataset: Record<string, string>}>} inputs
 */
export const attrsWorthSending = (inputs) => [...(inputs ?? [])]
    .filter((input) => input.value !== (input.dataset?.imgAttrWas ?? ''));
