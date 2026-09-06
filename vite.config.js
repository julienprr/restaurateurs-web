import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Sans cette exclusion, le service worker répondrait index.html aux
        // appels d'API et au flux temps réel.
        navigateFallbackDenylist: [/^\/api/]
      },
      manifest: {
        name: 'Les Restaurateurs',
        short_name: 'Restaurateurs',
        description: 'La liste des restaurants du groupe, et où on va ce soir.',
        theme_color: '#1F2E22',
        background_color: '#1F2E22',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // Le front parle à l'API sur la même origine : pas de CORS à gérer.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  }
});
