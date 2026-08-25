import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so `dist` works on GitHub project Pages and locally.
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Forwards to scripts/gemini-proxy.mjs (127.0.0.1 only). No key in Vite.
    proxy: {
      '/api/gemini': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
