import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Extend from vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup file
    setupFiles: ['./src/tests/setup.ts'],
    
    // Test file patterns
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Coverage thresholds
      thresholds: {
        // Services, hooks, utils: 90%+
        'src/services/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        'src/hooks/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        'src/utils/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        // Components: 80%+
        'src/components/**/*.tsx': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
    
    // Reporters
    reporters: ['default', 'html', 'json'],
    
    // Globals (optional, allows using test functions without importing)
    globals: true,
  },
});
