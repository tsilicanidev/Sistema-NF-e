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
      '/nfeautorizacao4.asmx': {
        target: 'https://homologacao.nfe.fazenda.sp.gov.br/ws',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nfeautorizacao4.asmx/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to SEFAZ:', req.method, req.url);
            // Add required headers for SOAP requests
            proxyReq.setHeader('SOAPAction', '');
            proxyReq.setHeader('Content-Type', 'application/soap+xml;charset=utf-8');
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from SEFAZ:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
  },
});