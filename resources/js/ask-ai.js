/**
 * Ask AI, loaded when its button is first pressed (owner, 12 Nov 2026: "This shouldn't cause performance issues or
 * reasons for the live edit loading slowly"; "lightweight, stupidly fast"). The editor's own bundle does not carry it:
 * built on its own (resources/dist/ask-ai.js) and fetched once, by the editor that needs it.
 */
export { CHAT_CSS, createChat, startersFor } from './chat.js';
export { pageForTheChat, tappedForTheChat } from './chat-page.js';
