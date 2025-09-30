import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  coverage: {
    reporter: ['text', 'json', 'html'],
    include: ['src/**/*'],
    exclude: [
      'src/test/**/*',
      'src/**/*.d.ts',
      'src/main.tsx',
      'src/vite-env.d.ts',
    ],
  },
});