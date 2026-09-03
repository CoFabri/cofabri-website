import { defineConfig } from 'vitest/config';
import path from 'node:path';

const rootDir = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Pin the timezone so date-formatting/comparison tests are deterministic
    // regardless of the machine (or CI runner) running them.
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
});
