import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@slices': path.resolve(__dirname, './src/slices'),
        '@api': path.resolve(__dirname, './src/api'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@app-types': path.resolve(__dirname, './src/types'),
        '@locales': path.resolve(__dirname, './src/locales'),
        '@theme': path.resolve(__dirname, './src/theme'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@config': path.resolve(__dirname, './src/config'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@guards': path.resolve(__dirname, './src/guards'),
        '@libs': path.resolve(__dirname, './src/libs'),
        '@adapters': path.resolve(__dirname, './src/adapters'),
        '@routes': path.resolve(__dirname, './src/routes'),
      },
    },
    server: {
      host: true,
      port: 5175,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
            // mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            // query: ['@tanstack/react-query'],
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.1.0'),
    },
  };
});
