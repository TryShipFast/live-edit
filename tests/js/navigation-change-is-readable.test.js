import { beforeEach, describe, expect, it } from 'vitest';
import { describeListChange } from '../../resources/js/change-review.js';

describe('navigation changes in the publish review', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <nav aria-label="Primary">
                <ul data-edit-list="mainMenu">
                    <li data-edit-item="i0"><a>Home</a></li>
                    <li data-edit-item="i1"><a>Shop</a></li>
                    <li data-edit-item="i2"><a>About</a></li>
                </ul>
            </nav>`;
    });

    it('shows menu labels instead of item ids when the list key matches', () => {
        expect(describeListChange({
            key: 'mainMenu',
            before: '["i0","i1","i2"]',
            after: '["i1","i0","i2"]',
        })).toEqual({
            label: 'navigation order',
            before: 'Home · Shop · About',
            after: 'Shop · Home · About',
        });
    });

    it('still finds the menu if a migrated key differs from the markup key', () => {
        expect(describeListChange({
            key: 'oldMenuKey',
            before: null,
            after: '["i2","i0","i1"]',
        })).toEqual({
            label: 'navigation order',
            before: null,
            after: 'About · Home · Shop',
        });
    });
});
