import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { VitePWA } from 'vite-plugin-pwa' // PWA 플러그인 임포트

export default defineConfig({
  base: '/view-games/', // GitHub 저장소 경로
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Yuri Games',
        short_name: 'Yuri Game',
        description: 'TypeScript 기반 웹앱 게임',
        theme_color: '#000000',
        display: 'fullscreen',   // 홤면에 꽉차게. 폰에서는 상단 시계 등도 안보이게.
        //display: 'standalone',   // <--- 브라우저 UI(주소창 등)만 제거 (일반적인 앱 느낌)
        orientation: 'portrait', // 세로 모드 고정
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,    // 또는 '0.0.0.0' 이라고 써도 됩니다.
    port: 5173     // 원하는 포트 번호 (기본값은 5173)
  },
})