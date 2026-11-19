import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/__tests__/**', 'src/**/*.test.{js,jsx}', 'src/data/**', 'src/main.jsx'],
    },
  },
});
