import { defineConfig } from 'vitest/config';

export default defineConfig({
    // So .jsx compiles without every file importing React by hand.
    esbuild: { jsx: 'automatic' },
    test: {
        environment: 'happy-dom',
        include: ['tests/js/**/*.test.js', 'tests/react/**/*.test.jsx'],
    },
});
