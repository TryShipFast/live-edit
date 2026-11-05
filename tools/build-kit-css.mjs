// Writes resources/dist/kit-search.css from the search kit's base look (resources/js/kit-search-base.js), the
// stylesheet a host puts in the head of a page that holds a search, so it is drawn in its final shape at first paint.
import { writeFileSync } from 'node:fs';
import { BASE } from '../resources/js/kit-search-base.js';

writeFileSync(new URL('../resources/dist/kit-search.css', import.meta.url), `${BASE}\n`);
