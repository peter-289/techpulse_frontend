import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@processes': fileURLToPath(new URL('./src/processes', import.meta.url)),
      '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.jsx'],
    globals: true,
    exclude: ['**/node_modules/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/entities/**/*.{ts,tsx}',
        'src/shared/lib/**/*.{ts,tsx}',
        'src/processes/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'src/entities/**/index.ts',
        'src/shared/lib/**/index.ts',
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 80,
        branches: 75,
      },
    },
  },
});
