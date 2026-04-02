<template>
  <main class="chat-wrapper-area" ref="chatMain">
    <div class="message-list">
      <div v-for="(msg, index) in messages" :key="index" 
           :class="['message-item', msg.isMe ? 'my-msg' : 'other-msg']">
        <div class="sender">{{ msg.sender }}</div>
        <div class="text-box">{{ msg.text }}</div>
        <div class="time">{{ msg.time }}</div>
      </div>
    </div> 

    <div class="input-area">
      <input v-model="inputText" @keyup.enter="sendMessage" placeholder="메시지를 입력하세요..." />
      <button @click="sendMessage">전송</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

// 인터페이스 및 데이터 로직 그대로 이동
interface ChatMessage {
  sender: string;
  text: string;
  isMe: boolean;
  time: string;
}

const messages = ref<ChatMessage[]>([
  { sender: '가이드 v1.1', text: '안녕하세요! 카톡 같은 깨톡을 만들어 봅시다.', isMe: false, time: '1' },
  { sender: '포교 지원 앱', text: '인터넷 전쟁에서 이겨야 대세를 돌립니다.', isMe: true, time: '2' },
  { sender: '지원 기기', text: '모든 종류의 PC, 모바일, 태블릿 등에서 사용 가능합니다.', isMe: true, time: '3' },
])

const chatMain = ref<HTMLElement | null>(null)
const inputText = ref<string>('')

const scrollToBottom = async () => {
  await nextTick()
  if (chatMain.value) {
    chatMain.value.scrollTop = chatMain.value.scrollHeight
  }
}

watch(messages, () => { scrollToBottom() }, { deep: true })
onMounted(() => { scrollToBottom() })

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
/* 기존 App.vue에 있던 채팅창 관련 CSS만 이쪽으로 옮겨옵니다 */
.chat-main-area { 
  flex: 1; overflow-y: auto; padding: 20px; background: #b2c7da; 
}
.nav-link {
  margin-right: 15px;
  text-decoration: none;
  color: #333;
  font-size: 13px;
  font-weight: bold;
}
/* 앱 전체 레이아웃 */
.chat-wrapper-area {
  display: flex;
  flex-direction: column;
  overflow-y: auto; padding: 20px; background: #111111; 
  height: 90vh;
  max-width: 500px; /* 모바일 사이즈 고정 */
  margin: 0 auto;
  /*background-color: #abc1d1; /* 카톡 배경색 */
  font-family: sans-serif;

  /* --- 배경 이미지 설정 부분 --- */
  background-image: url('@/assets/wood.jpg'); /* 이미지 경로를 넣어주세요 */
  background-size: cover;      /* 이미지가 창 크기에 꽉 차게 조절 */
  background-position: center; /* 이미지의 중심을 창 가운데에 맞춤 */
  background-repeat: no-repeat;
  background-color: rgba(44, 39, 39, 0.98);
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