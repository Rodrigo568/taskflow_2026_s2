import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Los tests e2e apuntan el proxy a su propia API.
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:3000',
    },
  },
});
