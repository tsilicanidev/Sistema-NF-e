// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///home/project/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname = "/home/project";
var logError = (message, error) => {
  console.error(`[Vite Config Error] ${message}`, error || "");
};
var validateSupabaseUrl = () => {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) {
    logError("VITE_SUPABASE_URL is not defined");
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch (e) {
    logError("Invalid VITE_SUPABASE_URL format", e);
    return false;
  }
};
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: validateSupabaseUrl() ? {
      "/functions/v1/validar-xml": {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        onError: (err) => {
          logError("Proxy error in /functions/v1/validar-xml", err);
        }
      },
      "/functions/v1/nfe": {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
        onError: (err) => {
          logError("Proxy error in /functions/v1/nfe", err);
        }
      }
    } : void 0
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG4vLyBFcnJvciBsb2dnaW5nIGZ1bmN0aW9uXG5jb25zdCBsb2dFcnJvciA9IChtZXNzYWdlOiBzdHJpbmcsIGVycm9yPzogYW55KSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoYFtWaXRlIENvbmZpZyBFcnJvcl0gJHttZXNzYWdlfWAsIGVycm9yIHx8ICcnKTtcbn07XG5cbi8vIFZhbGlkYXRlIFN1cGFiYXNlIFVSTFxuY29uc3QgdmFsaWRhdGVTdXBhYmFzZVVybCA9ICgpID0+IHtcbiAgY29uc3QgdXJsID0gcHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkw7XG4gIGlmICghdXJsKSB7XG4gICAgbG9nRXJyb3IoJ1ZJVEVfU1VQQUJBU0VfVVJMIGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHRyeSB7XG4gICAgbmV3IFVSTCh1cmwpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nRXJyb3IoJ0ludmFsaWQgVklURV9TVVBBQkFTRV9VUkwgZm9ybWF0JywgZSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgQnVmZmVyOiB0cnVlLFxuICAgICAgICBnbG9iYWw6IHRydWUsXG4gICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB2YWxpZGF0ZVN1cGFiYXNlVXJsKCkgPyB7XG4gICAgICAnL2Z1bmN0aW9ucy92MS92YWxpZGFyLXhtbCc6IHtcbiAgICAgICAgdGFyZ2V0OiBwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTCxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBvbkVycm9yOiAoZXJyKSA9PiB7XG4gICAgICAgICAgbG9nRXJyb3IoJ1Byb3h5IGVycm9yIGluIC9mdW5jdGlvbnMvdjEvdmFsaWRhci14bWwnLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJy9mdW5jdGlvbnMvdjEvbmZlJzoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfVVJMLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIG9uRXJyb3I6IChlcnIpID0+IHtcbiAgICAgICAgICBsb2dFcnJvcignUHJveHkgZXJyb3IgaW4gL2Z1bmN0aW9ucy92MS9uZmUnLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSA6IHVuZGVmaW5lZFxuICB9LFxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBSHhCLElBQU0sbUNBQW1DO0FBTXpDLElBQU0sV0FBVyxDQUFDLFNBQWlCLFVBQWdCO0FBQ2pELFVBQVEsTUFBTSx1QkFBdUIsT0FBTyxJQUFJLFNBQVMsRUFBRTtBQUM3RDtBQUdBLElBQU0sc0JBQXNCLE1BQU07QUFDaEMsUUFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixNQUFJLENBQUMsS0FBSztBQUNSLGFBQVMsa0NBQWtDO0FBQzNDLFdBQU87QUFBQSxFQUNUO0FBQ0EsTUFBSTtBQUNGLFFBQUksSUFBSSxHQUFHO0FBQ1gsV0FBTztBQUFBLEVBQ1QsU0FBUyxHQUFHO0FBQ1YsYUFBUyxvQ0FBb0MsQ0FBQztBQUM5QyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLE1BQ1osU0FBUztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLE1BQ1g7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTyxvQkFBb0IsSUFBSTtBQUFBLE1BQzdCLDZCQUE2QjtBQUFBLFFBQzNCLFFBQVEsUUFBUSxJQUFJO0FBQUEsUUFDcEIsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDLFFBQVE7QUFDaEIsbUJBQVMsNENBQTRDLEdBQUc7QUFBQSxRQUMxRDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLHFCQUFxQjtBQUFBLFFBQ25CLFFBQVEsUUFBUSxJQUFJO0FBQUEsUUFDcEIsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDLFFBQVE7QUFDaEIsbUJBQVMsb0NBQW9DLEdBQUc7QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLElBQUk7QUFBQSxFQUNOO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
