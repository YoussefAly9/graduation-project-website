import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true
  },
  preview: {
    port: 4173,
    host: true
  },
  build: {
    // Ensure service worker and manifest are properly handled
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    },
    // Set a reasonable chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  // Ensure public assets are properly served
  publicDir: 'public'
});

