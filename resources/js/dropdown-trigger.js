const MENU_TRIGGERS = [
    '[data-bs-toggle="dropdown"]',
    '[data-toggle="dropdown"]',
    '[aria-haspopup="menu"]',
    '[aria-haspopup="true"]',
    '[aria-expanded]',
    '[data-menu-trigger]',
    '[data-drop-toggle]',
    '[data-mega-toggle]',
    '[data-mnav-open]',
    '[data-menu-close]',
    '[data-menu]',
    '[data-menu-open]',
    '[data-menu-btn]',
    '[data-menu-toggle]',
    '[data-live-edit-dropdown]',
    '.dropdown-toggle',
    '.menu-toggle',
    '.menu-open',
    '.menu-button',
    '.has-dropdown > a',
    '.menu-item-has-children > a',
    '.nav-item.dropdown > a',
].join(', ');

/** Return the explicit menu control under a click, if there is one. */
export const dropdownTriggerFrom = (target) => target?.closest?.(MENU_TRIGGERS) ?? null;
