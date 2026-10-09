import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.OMNIVOY_BACKEND_PROXY_TARGET || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
});
