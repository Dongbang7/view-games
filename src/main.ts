import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { registerSW } from 'virtual:pwa-register'

// 서비스 워커 등록 (PWA의 핵심 부품입니다!)
registerSW({ immediate: true })

const app = createApp(App)

app.use(createPinia())
app.use(router)

console.log(`START: ${import.meta.env.VITE_USER_NAME}`); // OK 유리

app.mount('#app')
