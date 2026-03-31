<template>
  <div class="new-page">
    <h1>Page2, ID: {{ auth.ID }}</h1>
    <h2>Name: {{ auth.userName }}</h2>
    <hr />
    <div class="data-display">
      <p><strong>문자열(String):</strong> {{ msgString }}</p>
      <p><strong>숫자형(Number):</strong> {{ msgNumber }}</p>
      <p><strong>논리형(Boolean):</strong> {{ msgBool ? '참(true)입니다' : '거짓(false)입니다' }}</p>
      <p><strong>배열(Array):</strong> {{ msgArray.join(' -> ') }}</p>
    </div>
    <router-link to="/" class="back-btn">채팅창으로 돌아가기</router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
console.log(auth.userName); // '유리' 출력

const route = useRoute();
if (route.path === '/page2') {
  console.log("지금 유리님은 Page2을 보고 계시네요!");
}

// 부모(App.vue)로부터 데이터를 전달받는 'Props' 설정
defineProps<{
  msgString: string;
  msgNumber: number;
  msgBool: boolean;
  msgArray: string[];
}>();
</script>

<style scoped>
.new-page { padding: 30px; text-align: center; background: #f0f4f7; height: 100vh; }
.data-display { background: white; padding: 20px; border-radius: 10px; display: inline-block; text-align: left; border: 1px solid #ddd; }
.back-btn { display: inline-block; margin-top: 20px; color: #4a90e2; text-decoration: none; font-weight: bold; }
</style>