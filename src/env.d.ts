// .vue 파일이 무엇인지 TypeScript에게 알려주는 코드입니다.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
/// <reference types="vite-plugin-pwa/client" />
