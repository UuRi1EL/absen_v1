import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'images/*.jpg', 'images/*.png'],
      manifest: {
        name: 'Sistem Presensi Guru • UPT SPF SD INPRES PAJJAIANG 2',
        short_name: 'ABSEN PJJ2',
        description: 'Sistem Informasi Presensi Guru & Kepala Sekolah UPT SPF SD INPRES PAJJAIANG 2 Makassar Berbasis GPS Geofencing, Live Selfie, dan QR Code.',
        theme_color: '#d92509',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any maskable'
          },
          {
            src: 'https://cdn.schoolpro.id/public-registration/1782136552284-18747eee3e1c432291f9002be1c93df8.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  clearScreen: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true, // Izinkan HP terhubung via jaringan Wi-Fi lokal
    allowedHosts: true, // Izinkan akses dari domain tunnel mana saja (localhost.run, ngrok, localtunnel)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
});
