import { defineConfig } from '@playwright/test';

/*
 * Point BASE_URL at any site running the editor. The cases in tests/e2e are
 * invariants rather than assertions about one theme, so they apply to all of
 * them.
 */
export default defineConfig({
    testDir: './tests/e2e',
    // These drive one site's stored content, so they must not race each other.
    workers: 1,
    fullyParallel: false,
    reporter: [['list']],
    use: {
        baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:8401',
        trace: 'retain-on-failure',
    },
});
