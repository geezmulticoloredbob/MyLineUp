import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Only a production build ships anywhere real — vite dev/preview keep the
  // convenience localhost:5000 fallback in apiClient.js. Without this, a
  // build missing VITE_API_URL succeeds silently and every API call quietly
  // targets localhost:5000 once deployed, which the browser can't reach.
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), '');
    if (!env.VITE_API_URL) {
      throw new Error(
        'VITE_API_URL is not set. A build without it will silently target http://localhost:5000 ' +
        'and every API call will fail once deployed. Set VITE_API_URL to your deployed API URL ' +
        '(see client/.env.example) before building.'
      );
    }
  }

  return {
    plugins: [react()],
  };
});
