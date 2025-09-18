import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const API_URL = `${env.VITE_API_BASE_URL ?? 'https://909a-59-66-19-88.ngrok-free.app/api/v1'}`;

  console.log(API_URL);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/ws': {
          target: 'wss://909a-59-66-19-88.ngrok-free.app/api/v1/ws',
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ws/, ''),
        },
      },
    },
  };
});
