import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['tests/setup/unit.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/unit'
    },
    alias: {
      '@src': '/src'
    },
    clearMocks: true,
    allowOnly: !process.env.CI,
    exclude: [
      'tests/integration/**',
      'dist/**',
      'node_modules/**'
    ]
  }
});

