import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API and the uploaded images both live on the Express server in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
