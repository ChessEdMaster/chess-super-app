import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Default to node environment for pure logic tests
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}', 'lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**', 'components/**', 'hooks/**'],
      exclude: ['**/node_modules/**', '**/*.d.ts'],
    },
    // Use per-file environment overrides for component tests
    // environmentMatchGlobs: [['tests/**/*.component.test.tsx', 'jsdom']],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
