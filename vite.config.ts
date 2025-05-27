import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

// Error logging function
const logError = (message: string, error?: any) => {
  console.error(`[Vite Config Error] ${message}`, error || '');
};

// Validate Supabase URL
const validateSupabaseUrl = () => {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) {
    logError('VITE_SUPABASE_URL is not defined');
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch (e) {
    logError('Invalid VITE_SUPABASE_URL format', e);
    return false;
  }
};

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
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: validateSupabaseUrl() ? {
      '/functions/v1/validar-xml': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        onError: (err) => {
          logError('Proxy error in /functions/v1/validar-xml', err);
        }
      },
      '/functions/v1/nfe': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        onError: (err) => {
          logError('Proxy error in /functions/v1/nfe', err);
        }
      }
    } : undefined
  },
});