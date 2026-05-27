import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[jt]sx?$/,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          tanstack: ['@tanstack/react-query'],
          charts: ['recharts'],
          motion: ['framer-motion'],
          forms: ['react-hook-form', 'zod'],
          msw: ['msw'],
          icons: ['lucide-react', 'react-icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
