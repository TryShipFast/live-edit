const MENU_TRIGGERS = [
    '[data-bs-toggle="dropdown"]',
    '[data-toggle="dropdown"]',
    '[aria-haspopup="menu"]',
    '[data-menu-trigger]',
    '[data-menu-open]',
    '[data-menu-btn]',
    '[data-menu-toggle]',
    '[data-live-edit-dropdown]',
    '.dropdown-toggle',
    '.menu-toggle',
    '.menu-open',
    '.menu-button',
].join(', ');

/** Return the explicit menu control under a click, if there is one. */
export const dropdownTriggerFrom = (target) => target?.closest?.(MENU_TRIGGERS) ?? null;
