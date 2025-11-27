import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['boscoimoveis.svg', 'icon-192.png', 'icon-512.png'],
      
      manifest: {
        name: 'Bosco Imóveis - Encontre seu imóvel dos sonhos',
        short_name: 'Bosco Imóveis',
        description: 'Encontre as melhores casas, apartamentos e terrenos em Goiânia',
        theme_color: '#1e3a8a',
        background_color: '#1e3a8a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        
        icons: [
          {
            src: '/boscoimoveis.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        
        categories: ['business', 'lifestyle', 'shopping'],
        
        shortcuts: [
          {
            name: 'Ver Catálogo',
            short_name: 'Catálogo',
            description: 'Explore todos os imóveis',
            url: '/catalogo',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Promoções',
            short_name: 'Promoções',
            description: 'Imóveis com desconto',
            url: '/promocoes',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Favoritos',
            short_name: 'Favoritos',
            description: 'Seus imóveis salvos',
            url: '/favoritos',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      
      workbox: {
        // Cache de runtime
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cloud\.appwrite\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'appwrite-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              }
            }
          }
        ],
        
        // Arquivos para pré-cache
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2}'
        ],
        
        // Tamanho máximo do cache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        
        // Estratégia de navegação
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
