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
      '/nfe': {
        target: 'https://homologacao.nfe.fazenda.sp.gov.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nfe/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to SEFAZ:', req.method, req.url);
            // Set required SOAP headers
            proxyReq.setHeader('SOAPAction', 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote');
            proxyReq.setHeader('Content-Type', 'application/soap+xml;charset=utf-8');
            // Add additional headers required by SEFAZ
            proxyReq.setHeader('Accept', 'application/soap+xml');
            proxyReq.setHeader('Connection', 'keep-alive');
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from SEFAZ:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
  },
});