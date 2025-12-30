// packages/db/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from "path"

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/test/setup.ts'],
        isolate: true,
        testTimeout: 30000,
        hookTimeout: 30000,
    },
    resolve: {
        alias: {
            '@db': path.resolve(__dirname, './src'),
        },
    },
})