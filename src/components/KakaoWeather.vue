<template>
  <transition name="fade">
    <div v-if="weatherInfo" class="weather-panel">
      <div class="weather-content">
        <div class="location">{{ weatherInfo.name }} <span style="font-size:18px;"> 시간: {{ timeString }}</span> </div>
        
        <div class="temp-main">{{ weatherInfo.main.temp }}°C
          <span class="desc"> {{ weatherInfo.weather[0].description }}</span>
        </div>
        <div class="wind-compass-section">
              <h3>풍향</h3>
              <div class="compass-container">
                <svg viewBox="0 0 100 100" class="compass-svg">
                  <circle cx="50" cy="50" r="48" class="compass-circle" />
                  
                  <text x="50" y="15" text-anchor="middle" class="direction-text">N</text>
                  <text x="50" y="92" text-anchor="middle" class="direction-text">S</text>
                  <text x="88" y="55" text-anchor="middle" class="direction-text">E</text>
                  <text x="12" y="55" text-anchor="middle" class="direction-text">W</text>
                  
                  <g :style="{ transform: `rotate(${arrowRotation}deg)`, transformOrigin: '50px 50px' }" class="arrow-group">
                          <line x1="50" y1="50" x2="50" y2="25" class="arrow-line" />
                          <polygon points="50,15 45,25 55,25" class="arrow-head" />
                          <circle cx="50" cy="50" r="3" class="arrow-center" />
                  </g>
                </svg>
                <div class="wind-text">{{ windDirectionDeg }}°</div>
              </div>
            </div>

        <hr class="divider" />

        <div class="weather-grid">
          <div class="grid-item">
            <span class="label">풍속</span>
            <span class="value">{{ weatherInfo.wind.speed }} m/s</span>
          </div>
          <div class="grid-item">
            <span class="label">풍향</span>
            <span class="value">{{ getWindDirection(weatherInfo.wind.deg) }} / {{weatherInfo.wind.deg}}도</span>
          </div>
          <div class="grid-item">
            <span class="label">최고/최저</span>
            <span class="value">{{ Math.round(weatherInfo.main.temp_max) }}° / {{ Math.round(weatherInfo.main.temp_min) }}°</span>
          </div>
          <div class="grid-item">
            <span class="label">습도</span>
            <span class="value">{{ weatherInfo.main.humidity }}%</span>
          </div>
          <div class="grid-item">
            <span class="label">기압</span>
            <span class="value">{{ weatherInfo.main.pressure }} hPa</span>
          </div>
        </div>

        <button class="close-btn" @click="weatherInfo = null">닫기</button>
        <button class="close-btn" @click="Refresh()">Refresh</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
//import { defineExpose } from 'vue';
import { ref, computed } from 'vue';
import axios from 'axios';

const now = new Date();

// 'ko-KR' (한국) 기준, 24시간제(hour12: false)로 시:분만 추출
// const timeString = now.toLocaleTimeString('ko-KR', {
//   hour: '2-digit',
//   minute: '2-digit',
//   hour12: false
// });
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
var timeString = `${hours}:${minutes}`;

// 풍향 각도를 저장할 반응형 변수 (기본값 0도)
const windDirectionDeg = ref<number>(0);

// 화살표가 실제로 가리켜야 할 각도 (180도 반전)
const arrowRotation = computed(() => {
  return (windDirectionDeg.value + 180) % 360;
});

const weatherInfo = ref<any>(null);
const myApiKey = 'e198f4243bb3248d8d39d94ada6e1b9b'; 
const city = 'Daejeon';

const getWeather = async () => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=kr&appid=${myApiKey}`;
  try {
    const response = await axios.get(url);
    weatherInfo.value = response.data;
    
    // API 응답 데이터에서 풍향 각도(wind.deg)를 추출해서 저장
    if (response.data.wind && response.data.wind.deg !== undefined) {
      windDirectionDeg.value = response.data.wind.deg;
    } else {
      windDirectionDeg.value = 0; // 데이터가 없으면 0도로 초기화
    }
  } catch (error) {
    console.error("날씨 정보를 가져오는 중 오류 발생:", error);
    alert("날씨 정보를 가져오지 못했습니다.");
  }  
};

// 풍향 각도를 한글 방향으로 변환하는 함수
const getWindDirection = (deg: number) => {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
  return directions[index] + '풍';
};

const Refresh = () => {
  let now = new Date();
  let hours = String(now.getHours()).padStart(2, '0');
  let minutes = String(now.getMinutes()).padStart(2, '0');
  timeString = `${hours}:${minutes}`;
  getWeather();
};
// App.vue에서 호출할 수 있도록 함수 노출
defineExpose({ getWeather });
</script>

<style scoped>
body {
  color: #f7e9e9;
}
.weather-panel {
  position:absolute; /* top: 60px; left: 15px; right: 15px; */
  top: 50px;          /* 헤더 바로 아래 여유 공간 */
  /*right: 20%;        /* 화면 오른쪽에 붙여서 배치 (빌더의 Align 비슷) */
  color: #f7e9e9;

  /* 가로 크기를 부모 컨테이너의 1/3로 설정 */
  width: 350px;      
  min-width: 200px;   /* 너무 작아져서 글자가 깨지는 것 방지 */  

  /* --- 배경 이미지 설정 부분 --- */
  /* background-image: url('@/assets/w2.jpg'); /* 이미지 경로를 넣어주세요 */
  background-size: cover;      /* 이미지가 창 크기에 꽉 차게 조절 */
  background-position: center; /* 이미지의 중심을 창 가운데에 맞춤 */
  background-repeat: no-repeat;

  background-color: rgba(65, 62, 62, 0.98);
  background-blend-mode: overlay; 
  border-radius: 30px; padding: 20px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  z-index: 100; border: 1px solid #eee;
  border: 1px solid #eee;
}

.location { font-size: 20px; color: #f7e9e9; margin-bottom: 5px; }
.temp-main { font-size: 30px; font-weight: bold; color: #333; }
.desc { font-size: 20px; color: #4a90e2; font-weight: bold; margin-bottom: 15px; }

.divider { border: 0; border-top: 1px solid #f0f0f0; margin: 15px 0; }

/* 2열 그리드로 상세 정보 배치 */
.weather-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  text-align: left;
}

.grid-item { display: flex; flex-direction: column; }
.label { font-size: 14px; color: #999; margin-bottom: 2px; }
.value { font-size: 18px; font-weight: 600; color: #444; }

.close-btn {
  margin-top: 20px; width: 50%; padding: 12px; 
  border: none; background: #757575; border-radius: 10px;
  font-weight: bold; cursor: pointer;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.wind-compass-section {
  margin-top: 20px;
  text-align: center;
}

.compass-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.compass-svg {
  width: 100px;  /* 조그마한 그림 크기 조정 */
  height: 100px;
}

.compass-circle {
  fill: none;
  stroke: #333; /* 테두리 색상 */
  stroke-width: 2;
}

.direction-text {
  font-size: 12px;
  font-weight: bold;
  fill: #555; /* 글자 색상 */
}

/* 화살표 스타일 */
.arrow-line {
  stroke: #e74c3c; /* 바늘 색상 (빨간색) */
  stroke-width: 3;
  stroke-linecap: round;
}

.arrow-head {
  fill: #e74c3c; /* 화살표 머리 색상 */
}

.arrow-center {
  fill: #333; /* 중앙 점 색상 */
}

/* 화살표 회전 애니메이션 (부드럽게 움직이게) */
.arrow-group {
  transition: transform 0.5s ease-out;
}

.wind-text {
  font-size: 14px;
  color: #666;
}
</style>






<!-- 
<template>
  <div class="kakao-app">
    <header class="header">
      <span class="title">채팅</span>
      <div class="menu">
        <span class="icon">🔍</span>
        <span class="icon">☰</span>
      </div>
    </header>

    <div v-if="weather" class="weather-overlay">
      <div class="weather-box">
        <div class="city">{{ weather.name }}</div>
        <div class="temp">{{ Math.round(weather.main.temp) }}°C</div>
        <div class="desc">{{ weather.weather[0].description }}</div>
        <button @click="weather = null" class="close-btn">확인</button>
      </div>
    </div>

    <main class="chat-list">
      <div class="empty-msg">"날씨" 버튼을 눌러 실시간 정보를 확인하세요.</div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      weather: null,
      // OpenWeatherMap에서 발급받은 API 키를 여기에 넣으세요.
      apiKey: 'e198f4243bb3248d8d39d94ada6e1b9b', 
      city: 'Daejeon'
    };
  },
  methods: {
    async getWeather() {
      try {
        // 실제 날씨 정보 사이트(OpenWeatherMap)의 API를 호출합니다.
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=metric&lang=kr&appid=${this.apiKey}`;
        const response = await axios.get(url);
        
        // 받아온 데이터를 Vue 데이터 객체에 저장 (화면 자동 갱신)
        this.weather = response.data;
      } catch (error) {
        console.error("날씨 데이터를 가져오지 못했습니다.", error);
        alert("API 키를 확인하거나 잠시 후 다시 시도해주세요.");
      }
    }
  }
};
/*
props: ['triggerFetch'],
watch: {
  triggerFetch() {
    this.getWeather(); // 부모에서 신호가 바뀔 때마다 실행
  }
}
  */
</script>

<style scoped>
.kakao-app {
  width: 360px; height: 100px;
  background-color: #abc1d1;
  position: relative;
  display: flex; flex-direction: column;
}

.header {
  background: #f9f9fb; padding: 15px;
  display: flex; justify-content: space-between; align-items: center;
}

.weather-btn {
  background: #fee500; border: none; padding: 4px 10px;
  border-radius: 12px; font-weight: bold; cursor: pointer; margin-right: 8px;
}

/* 날씨 정보 팝업 스타일 */
.weather-overlay {
  position: absolute; top: 60px; left: 20px; right: 20px;
  background: white; border-radius: 15px; padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  text-align: center; z-index: 10;
}

.city { font-size: 1.1rem; color: #666; }
.temp { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
.desc { color: #3498db; margin-bottom: 15px; }

.close-btn {
  width: 100%; padding: 8px; background: #eee;
  border: none; border-radius: 5px; cursor: pointer;
}

.chat-list { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty-msg { color: rgba(0,0,0,0.4); font-size: 0.9rem; }
</style> -->