import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['lib/**/__tests__/**/*.test.{ts,tsx}', 'components/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['__tests__/e2e/**', '__tests__/sql/**', '__tests__/edge-functions/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Metro does this internally; mirror it so RN component imports resolve in jsdom.
      'react-native': 'react-native-web',
    },
  },
});
