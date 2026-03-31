<template>
  <div class="kakao-wrapper">
    <header class="header">
      <div class="header-left">채팅</div>
      <div class="header-right">
        <router-link to="/page1" class="nav-link">Page1</router-link>
        <button class="weather-btn" @click="callChildWeather">날씨</button>
        <KakaoWeather ref="weatherComp" />
        <span class="icon">🔍</span>
        <span class="icon">☰</span>
      </div>
    </header>
    <main class="chat-main" ref="chatMain">
      <div v-for="(msg, index) in messages" :key="index" 
           :class="['message-row', msg.isMe ? 'me' : 'other']">
        
        <div v-if="!msg.isMe" class="profile">👤</div>
        
        <div class="message-content">
          <div v-if="!msg.isMe" class="sender-name">{{ msg.sender }}</div>
          <div class="bubble-group">
            <div class="bubble">{{ msg.text }}</div>
            <span class="time">{{ msg.time }}</span>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <button class="plus-btn">+</button>
      <input type="text" v-model="inputText" @keyup.enter="sendMessage" placeholder="메시지를 입력하세요" />
      <button class="send-btn" @click="sendMessage">전송</button>
    </footer>
  </div>
    <router-view 
      msgString="반가워요 유리님!" 
      :msgNumber="2026" 
      :msgBool="true" 
      :msgArray="['C++', 'Go', 'Vue']" 
    />
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import axios from 'axios';
import KakaoWeather from './components/KakaoWeather.vue';

// 1. 자식 컴포넌트를 가리키기 위한 ref 변수 선언 (변수명이 ref="weatherComp"와 같아야 함)
const weatherComp = ref<any>(null);

// 2. 날씨 호출 함수 (이제 'this' 없이 직접 호출합니다)
const callChildWeather = () => {
  if (weatherComp.value) {
    // 자식 컴포넌트 내부의 getWeather 함수 실행
    weatherComp.value.getWeather();
  } else {
    console.error("날씨 컴포넌트를 찾을 수 없습니다.");
  }
}

// 인터페이스 정의
interface ChatMessage {
  sender: string;
  text: string;
  isMe: boolean;
  time: string;
}

// 데이터 모델
const messages = ref<ChatMessage[]>([
  { sender: 'AI 가이드', text: '안녕하세요 유리님! Vue로 만든 채팅창입니다.', isMe: false, time: '오전 10:00' },
  { sender: '유리', text: '와, 빌더 6.0보다 훨씬 빠르고 간편하네요!', isMe: true, time: '오전 10:01' },
  { sender: 'AI 가이드', text: '이미지나 동영상도 금방 넣을 수 있어요.', isMe: false, time: '오전 10:02' },
])

const chatMain = ref<HTMLElement | null>(null)
const inputText = ref<string>('')

const scrollToBottom = async () => {
  await nextTick()
  if (chatMain.value) {
    chatMain.value.scrollTop = chatMain.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})

const sendMessage = () => {
  if (!inputText.value.trim()) return
  
  const newMessage: ChatMessage = {
    sender: '유리',
    text: inputText.value,
    isMe: true,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  messages.value.push(newMessage)
  inputText.value = ''
}
</script>

<style scoped>
.nav-link {
  margin-right: 15px;
  text-decoration: none;
  color: #333;
  font-size: 13px;
  font-weight: bold;
}
/* 앱 전체 레이아웃 */
.kakao-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 500px; /* 모바일 사이즈 고정 */
  margin: 0 auto;
  /*background-color: #abc1d1; /* 카톡 배경색 */
  font-family: sans-serif;

    /* --- 배경 이미지 설정 부분 --- */
  /*background-image: url('@/assets/r.jpg'); /* 이미지 경로를 넣어주세요 */
  background-size: cover;      /* 이미지가 창 크기에 꽉 차게 조절 */
  background-position: center; /* 이미지의 중심을 창 가운데에 맞춤 */
  background-repeat: no-repeat;

  background-color: rgba(56, 51, 51, 0.98);
  background-blend-mode: overlay; 
}

/* 헤더 스타일 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  background: rgba(255, 255, 255, 0.1);
}
.title { font-size: 15px; margin: 0; }

/* 채팅창 영역 */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 말풍선 공통 스타일 */
.message-row { display: flex; gap: 8px; color:#0f0f0f }
.message-row.me { flex-direction: row-reverse; }

.bubble {
  max-width: 300px;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
}

/* 상대방 말풍선 */
.other .bubble { background: white; border-top-left-radius: 0; }
/* 내 말풍선 */
.me .bubble { background: #f7e337; border-top-right-radius: 0; }

.time { font-size: 10px; color: #555; align-self: flex-end; }
.bubble-group { display: flex; align-items: flex-end; gap: 5px; }
.me .bubble-group { flex-direction: row-reverse; }

/* 하단 입력창 */
.footer {
  display: flex;
  padding: 10px;
  background: white;
  gap: 10px;
}
input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 15px;
  outline: none;
}
.send-btn { background: #fee500; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; }
/* 채팅창 스크롤바 커스텀 */
.chat-main::-webkit-scrollbar {
  width: 6px;
}
.chat-main::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 1, 0.1);
  border-radius: 10px;
}
.chat-main::-webkit-scrollbar-track {
  background: transparent;
}
</style>