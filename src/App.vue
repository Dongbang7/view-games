<template>
  <div class="app-container">
    <header class="kakao-header">
      <div class="header-right">
        <router-link to="/" @click="currentPage = 'home'" class="nav-link">깨톡</router-link>
        <!-- <router-link to="/page1" @click="currentPage = 'Page1'" class="nav-link">P1</router-link>
        <router-link to="/page2" @click="currentPage = 'Page2'" class="nav-link">P2</router-link> -->
        <router-link to="/game2048" @click="currentPage = 'game2048'" class="nav-link">2048</router-link>
        <router-link to="/gameTetris" @click="currentPage = 'gameTetris'" class="nav-link">Tetris</router-link>
        <router-link to="/gameMine" @click="currentPage = 'gameMine'" class="nav-link">Mine</router-link>
        <router-link to="/gameBlock" @click="currentPage = 'gameBlock'" class="nav-link">Bricks</router-link>
        <router-link to="/gameDragon" @click="currentPage = 'gameDragon'" class="nav-link">Dragon</router-link>
        <router-link to="/gamePang" @click="currentPage = 'gamePang'"  class="nav-link">PangPang</router-link>
        <button @click="callChildWeather" class="tab-item">날씨</button>
      </div>
    </header>

    <!-- 이렇게하면 하위 페이지 모두에 항상 데이타가 넘어가니 login 정보 등 전역변수는 여기에. 그 페이지에만 넘기고 싶으면 index.ts 라우트 파일에 명시하는게 좋다.  -->
    <!-- <router-view />
      msgString="반가워요 유리님!" 
      :msgNumber="2026" 
      :msgBool="true" 
      :msgArray="['C++', 'Go', 'Vue']" 
    /> -->
    <!-- 하위 페이지가 생성될때 이 페이지 및 채팅창 등도 살아 있게 하려면. -->
    <router-view v-slot="{ Component }" :activePage="currentPage"> 
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <KakaoWeather ref="weatherComp" />
    <div class="digital-clock">
      <span class="time-text">{{ currentTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
  https://Dongbang7.github.io/view-games
*/
import { ref, onMounted, onUnmounted } from 'vue'
import KakaoWeather from './components/KakaoWeather.vue'

// 버튼 클릭 시 설치 창을 강제로 띄우는 코드 예시
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // 여기서 [설치하기] 버튼을 화면에 보이게 처리하면 됩니다!

});

// 이걸 쓰려면 :activePage="currentPage" 를 template에 넣어야 한다.
const currentPage = ref('home');

// 시간을 담을 반응형 변수
const currentTime = ref<string>('');
// 시간을 업데이트하는 함수
const updateTime = () => {
  const now = new Date();
  
  // 유리님이 보기 편한 포맷으로 설정 (예: 2026. 03. 26. 오후 4:05:10)
  currentTime.value = now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short', // (목)
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// PC 브라우저에서 사용자가 리사이즈하는 것을 감지해서 강제로 원래 크기로 돌려놓는 '꼼수'는 있지만, 사용자 경험에 좋지 않아 추천하지 않습
// 주의: 이 방식은 대부분의 현대 브라우저에서 차단되거나, 사용자 허가가 필요하며 제대로 작동하지 않을 확률이 높습니다.)
// App.vue의 mounted 훅 등에서 실행
window.addEventListener('resize', () => {
  // 원하는 크기 (예: 400x600)로 강제 고정
  if (window.innerWidth !== 400 || window.innerHeight !== 600) {
    window.resizeTo(400, 600); 
  }
});

let timer: number | undefined;

onMounted(() => {
  updateTime(); // 시작하자마자 한 번 실행
  // 1초마다 updateTime 실행 (빌더의 Timer->Interval = 1000과 동일)
  timer = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  // 컴포넌트가 사라질 때 타이머 해제 (메모리 누수 방지)
  if (timer) clearInterval(timer);
});

const weatherComp = ref<any>(null)

const callChildWeather = () => {
  if (weatherComp.value) {
    weatherComp.value.getWeather()
  }
}
</script>

<style>
:root {
  /* 라이트모드 기본값 */
  --nav-text: #ffffff;
  --nav-bg: #000000;
}

[data-theme='dark'] {
  /* 다크모드 설정 */
  --nav-bg: #1a1a1a;
  --nav-text: #ffffff;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  /* 핵심: 페이지 끝에서 튕기는 효과를 방지 */
  overscroll-behavior: none;
}

.nav-menu {
  background-color: var(--nav-bg);
  color: var(--nav-text);
}

/* 앱 전체 공통 스타일 (헤더, 컨테이너 등)만 남깁니다 */
.app-container { display: flex; flex-direction: column; height: 100vh; }
.kakao-header { 
  background-color: #1a1a1a !important; /* 검은색 계열 명시 */
  color: rgb(233, 219, 219);
  padding: 0px; display: flex; justify-content: flex-end; 
}

.nav-link {
  margin-right: 0px;
  text-decoration: none;
  color: #f0ecec;
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
.tab-item {
  margin-right: 2px;
  text-decoration: none;
  color: #d4d0d0;
  background-color: #3d19df;
  font-size: 13px;
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
.digital-clock {
  font-family: 'Courier New', Courier, monospace; /* 코딩 느낌 나는 폰트 */
  background: #333;
  color: #00ff00; /* 터미널 느낌의 초록색 */
  padding: 0px 10px;
  border-radius: 5px;
  display: inline-block;
  font-weight: bold;
}
</style>