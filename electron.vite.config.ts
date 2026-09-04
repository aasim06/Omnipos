import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
    build: {
      rollupOptions: {
        external: ['@prisma/client'],
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'INVALID_ANNOTATION' ||
            (warning.message && warning.message.includes('contains an annotation that Rollup cannot interpret'))
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: 'src/renderer',
    envDir: resolve('.'),
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
      },
    },
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'INVALID_ANNOTATION' ||
            (warning.message && warning.message.includes('contains an annotation that Rollup cannot interpret'))
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
    plugins: [react()],
  },
});
