import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

const REPO_BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: REPO_BASE,
  resolve: {
    alias: {
      $core: path.resolve('./src/core'),
      $app: path.resolve('./src/app'),
      $modules: path.resolve('./src/modules'),
      $ui: path.resolve('./src/ui'),
    },
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'No Distraction',
        short_name: 'NoDistraction',
        description: 'Minimalist productivity garden — calendar, tasks, notes, pomodoro.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F5F0E6',
        theme_color: '#1A1A1A',
        icons: [
          { src: 'icons/panda.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/panda.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ico}'],
        navigateFallback: './index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
