import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/sefaz': {
        target: 'https://nfe.sefaz.sp.gov.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sefaz/, ''),
      },
    },
  },
});