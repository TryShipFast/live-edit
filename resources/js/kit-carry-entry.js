// The entry built to resources/dist/kit-carry.js: carry() on its own, for the quote form's page (kit-carry.js).
import { carry } from './kit-carry.js';

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => carry());
else carry();
