import { describe, expect, it } from 'vitest';
import { dropdownTriggerFrom } from '../../resources/js/dropdown-trigger.js';

describe('dropdown triggers in edit mode', () => {
    it('recognizes the explicit mega-menu and mobile-menu controls', () => {
        document.body.innerHTML = `
            <nav>
                <div><button data-menu-trigger><span id="mega-label">Shop</span></button></div>
                <button data-menu-open id="mobile-menu">Menu</button>
                <button class="menu-toggle" aria-expanded="false" id="mobile-toggle">Menu</button>
            </nav>`;

        expect(dropdownTriggerFrom(document.getElementById('mega-label')).matches('[data-menu-trigger]')).toBe(true);
        expect(dropdownTriggerFrom(document.getElementById('mobile-menu'))).toBe(document.getElementById('mobile-menu'));
        expect(dropdownTriggerFrom(document.getElementById('mobile-toggle'))).toBe(document.getElementById('mobile-toggle'));
    });

    it('does not classify an ordinary editable link as a menu trigger', () => {
        document.body.innerHTML = '<a id="ordinary" href="/about" data-edit="setting:nav.about">About</a>';

        expect(dropdownTriggerFrom(document.getElementById('ordinary'))).toBeNull();
    });
});
