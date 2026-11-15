/*
 * An item added with its words (Ask AI: "add Saturday 2pm for Ngozi", "add 24 Dec to the days off"), as + Add then
 * typing does. After the add, the item that was not in the list before is the new one; its own text parts, in the
 * order they read (a part that only holds other parts is not one), take the words in turn. A word left empty (or null)
 * keeps the copy's words for that part. Any Kit list: nothing here knows a template.
 */

/** The ids of a list's items, to tell the new one afterwards. */
export const itemIdsOf = (list) => new Set([...(list?.children ?? [])].map((child) => child.dataset?.editItem).filter(Boolean));

/** The item in the list that was not there before, or null. */
export const newItemIn = (list, had) => [...(list?.children ?? [])].find((child) => child.dataset?.editItem && !had.has(child.dataset.editItem)) ?? null;

/** The new item's words to save, as the chat's text changes: [{ key, value }], in the order its parts read. */
export const wordsForNewItem = (item, words) => {
    if (!item || !Array.isArray(words)) return [];
    const parts = [...item.querySelectorAll('[data-edit^="setting:"]')]
        .filter((part) => part.closest('[data-edit-item]') === item && !part.querySelector('[data-edit^="setting:"]'));
    const out = [];
    words.forEach((value, i) => {
        if (typeof value !== 'string' || value.trim() === '' || !parts[i]) return;
        out.push({ key: parts[i].getAttribute('data-edit').slice('setting:'.length), value: value.trim() });
    });

    return out;
};
