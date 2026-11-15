// Writes resources/dist/kit-search.css from the search kit's base look (resources/js/kit-search-base.js), the
// stylesheet a host puts in the head of a page that holds a search, so it is drawn in its final shape at first paint.
import { writeFileSync } from 'node:fs';
import { BASE } from '../resources/js/kit-search-base.js';
// (kit-embeds.js starts only in a browser, so reading its look here runs nothing)
import { KIT_EMBEDS_CSS } from '../resources/js/kit-embeds.js';

writeFileSync(new URL('../resources/dist/kit-search.css', import.meta.url), `${BASE}\n`);

// And resources/dist/kit-embeds.css, the look of a video and a map (resources/js/kit-embeds.js), for the head of a page
// that holds one, so the 16:9 frame and the map's room are there at first paint and nothing moves.
writeFileSync(new URL('../resources/dist/kit-embeds.css', import.meta.url), `${KIT_EMBEDS_CSS}\n`);
