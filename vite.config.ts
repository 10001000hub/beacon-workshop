/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Relative base so the build works from any static sub-path (hash routing).
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/content/**/*.test.ts'],
    environment: 'node',
  },
});
