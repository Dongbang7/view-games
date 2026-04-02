<template>
  <div class="xpang-game">
    <h3> DongBang Pang &nbsp; v1.0</h3>
    <div class="score-layout">
        <div class="score-board">
            <div class="score-label">SCORE</div>
            <div class="score-value">{{ score.toLocaleString() }}</div>
        </div>
        <div class="game-info">
            <div class="timer-display" :class="{ 'low-time': timeLeft <= 15 }">
                TIME: {{ timeLeft }}s 
            </div>
            <transition name="bounce">
              <div v-if="combo >= 2" class="combo-badge">
                {{ combo }} COMBO! 🔥
              </div>
            </transition>
        </div>
    </div>
    <div v-if="!isGameActive" class="overlay">
        <button class="start-btn" @click="startGame">GAME START</button>
    </div>
    <div class="game-board-wrapper">
      <TransitionGroup name="brick-drop" tag="div" class="game-board" :class="{ 'is-panging': isBoardShaking }">
        <div 
          v-for="(brick, index) in flattedBoard" 
          :key="brick.id" 
          class="brick-cell"
          :class="[
            `brick-type-${brick.type}`,
            { 'is-selected': selectedAddr?.r === getRow(index) && selectedAddr?.c === getCol(index) }
          ]"
          :style="{ 
            gridRow: getRow(index) + 1, 
            gridColumn: getCol(index) + 1 
          }"
          @touchstart="(e) => onTouchStart(e, getRow(index), getCol(index))"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"

          @mousedown="(e) => onMouseDown(e, getRow(index), getCol(index))"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"

          @click="handleBrickClick(getRow(index), getCol(index))"
        >
          <span class="fruit-pang" style="font-size:27px">{{ getFruitEmoji(brick.type) }}</span>
          <!-- {{ brick.type === 0 ? '' : brick.type }} -->
        </div>
      </TransitionGroup>
    </div>

    <div class="controls">
      <br>
      <button style="padding: 3px 20px; color: white; background-color: gray;" @click="startGame">Restart</button>
    </div>
    <div style="color: white;">
        (C) Soft-Interior, 2026.3
    </div>
  </div>
</template>



<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'; // computed 추가
import { useXPang } from '../composables/useXPang';
import { useXPangSwipe } from '../composables/useXPangSwipe';

// 전역 객체 사용하기.
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
const gameStore = useGameStore()
// 주의: state나 getters를 구조 분해 할당할 때는 storeToRefs를 써야 반응성(실시간 업데이트)이 유지됩니다.
const { Score, playerName, doubleScore } = storeToRefs(gameStore)
const hitEnemy = () => {
  // action은 그냥 호출하면 됩니다.
  gameStore.addScore(10)
}
//------------

const { board, BOARD_SIZE, selectedAddr, initBoard, checkMatches, handleBrickClick, processMatch, 
        combo, score, startGame, endGame, timeLeft, isGameActive,
        resumeGame, pauseGame, isPaused, stopTimer } = useXPang();
const { onTouchStart, onTouchMove, onTouchEnd, 
        onMouseMove, onMouseUp, onMouseDown } = useXPangSwipe(handleBrickClick);

// props나 전역 상태로 현재 활성화된 게임 이름을 관리한다고 가정 (예: 'xpang')
//const props = defineProps(['activeGameName']);

// 1. 부모로부터 activePage라는 이름으로 값을 받겠다고 선언합니다.
const props = defineProps({
  activePage: String
});

// 2. 이제 props.activePage를 감시(watch)할 수 있습니다.
// 이 페이지는 mount unmount는 한번만 동작하고, 다른 게임 선택시는 여기 watch에서 동작한다.
// 즉 activePage 변수가 바뀔때 여기로 온다.

watch(() => props.activePage, (newPage) => {
  if (newPage !== 'gamePang') {
    // 페이지가 바뀌면 타이머를 멈춤
    pauseGame();
    console.log("다른 페이지로 이동: 타이머 일시정지");
  } else {
    // 다시 이 페이지로 돌아오면 재개
    if (isGameActive.value) {
      resumeGame();
      console.log("과일팡 복귀: 타이머 재개");
    }
  }
});

// 보드 흔들림 상태 관리
const isBoardShaking = ref(false);

// 핵심: 2차원 배열을 1차원으로 펼친 computed 속성
// TransitionGroup이 위치 변화를 감지하는 기준이 됩니다.
const flattedBoard = computed(() => board.value.flat());

// 인덱스를 2차원 좌표(r, c)로 변환하는 유틸리티 함수
const getRow = (index: number) => Math.floor(index / BOARD_SIZE);
const getCol = (index: number) => index % BOARD_SIZE;

// 핵심: 활성화된 게임이 'xpang'이 아니게 되면 즉시 타이머 중지
/*
watch(() => props.activeGameName, (newName) => {
    console.log(newName);
  if (newName !== 'GamePang') {
    stopTimer(); // 혹은 pauseGame();
  } else {
    // 다시 xpang으로 돌아왔을 때, 게임이 진행 중이었다면 재개
    if (isGameActive.value) resumeGame();
  }
});
*/

// processMatch 함수를 랩핑하여 흔들림 효과 추가
const handleProcessMatch = async (matches: { r: number; c: number }[]) => {
  if (matches.length > 0) {
    // 폭발 직전에 흔들림 시작
    isBoardShaking.value = true;
    
    // 폭발 처리 실행 (기존 useXPang의 함수 호출)
    await processMatch(matches);
    
    // 폭발이 끝나면 흔들림 중지 (0.3s 뒤)
    setTimeout(() => { isBoardShaking.value = false; }, 300);
  }
};

const getFruitEmoji = (type: number) => {
    const emojiMap: Record<number, string> = {
        1: '🍎', 2: '🍇', 3: '🍊', 4: '🍌', 5: '🍓', 99: '💣'
    };
    return emojiMap[type] || '';
};


// 벽돌 선택 함수 (스와이프 로직의 시작)
/*
const selectBrick = (r: number, c: number) => {
  console.log(`선택된 벽돌: ${r}, ${c}`, board.value[r]![c]);
  // 스와이프 로직은 다음 단계에서 구현 예정
};
*/
// 매칭된 벽돌 터뜨리기 (간단 버전)
/*
const pangBricks = () => {
  const matches = checkMatches();
  if (matches.length > 0) {
    console.log(`${matches.length}개 터짐!`, matches);
    // 실제 터지는 로직 (0으로 만들고 중력 처리)은 다음 단계에서!
  } else {
    console.log("터질 게 없네요.");
  }
};
*/

// 1. 다른 페이지로 이동하여 컴포넌트가 사라질 때
onUnmounted(() => {
  stopTimer();
  //pauseGame();
});

// 2. 다시 이 페이지로 돌아왔을 때 (만약 컴포넌트가 새로 생성된다면)
onMounted(() => {
  // 기존에 진행 중이었다면 이어서 시작하게 로직을 짤 수 있습니다.
  // (상태가 유지되는 Store를 쓴다면 resumeGame() 호출)
});

// 3. 브라우저 탭을 전환하거나 최소화했을 때 대응 (Visibility API)
const handleVisibilityChange = () => {
  if (document.hidden) {
    pauseGame();
  } else {
    resumeGame();
  }
};

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style scoped>
/* 간단한 게임 스타일 (CSS) */
.xpang-game {
  text-align: center;
}
.game-board {
  display: inline-block;
  border: 4px solid #333;
  padding: 4px;
}
.board-row {
  display: flex;
}
.brick-cell {
  width: 50px;
  height: 50px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  /* --- 모바일 최적화 (CSS) --- */
  touch-action: none; /* 브라우저의 기본 터치 동작(스크롤, 줌) 막기 (필수!) */
  user-select: none;   /* 텍스트나 이미지 선택 방지 */
  -webkit-user-drag: none; /* 이미지 드래그 방지 (iOS) */
  -webkit-tap-highlight-color: transparent; /* 클릭 시 파란 하이라이트 제거 */
  
  cursor: grab; /* PC에서 마우스를 올렸을 때 손바닥 모양 (잡기) */
  box-sizing: border-box;
}
/* 터치 중일 때 손바닥 오므리는 모양 */
.brick-cell:active {
  cursor: grabbing;
  transform: scale(0.95); /* 누르는 느낌 */
}
/* 동물 종류별 임시 색상 */
.brick-type-1 { background-color: #ffcccc; }
.brick-type-2 { background-color: #ccffcc; }
.brick-type-3 { background-color: #ccccff; }
.brick-type-4 { background-color: #ffffcc; }
.brick-type-5 { background-color: #ccffff; }
.brick-type-0 { background-color: transparent; } /* 빈칸 */
/* 기존 스타일 아래에 추가 */
.brick-cell.is-selected {
  outline: 4px solid #ff0000; /* 빨간색 테두리로 선택 표시 */
  outline-offset: -4px;
  transform: scale(1.1); /* 살짝 커지는 효과 */
  z-index: 10;
}
.brick-type-0 {
  background-color: #333; /* 터진 자리는 어둡게 표현 */
  transform: scale(0.5);   /* 작아지는 효과 */
  opacity: 0;
}
/* src/App.vue 의 <style scoped> 부분 (수정 및 추가) */

/* 기존 스타일 유지하면서 .game-board만 수정 */
.xgame-board {
  display: grid; /* Grid를 사용해 위치를 고정 */
  grid-template-columns: repeat(7, 50px);
  grid-template-rows: repeat(7, 50px);
  gap: 1px;
  border: 4px solid #333;
  padding: 4px;
  background-color: #ccc;
  overflow: hidden; /* 영역 밖으로 나가는 벽돌 숨김 */
}
.game-board {
  display: grid; /* 1. 그리드 모드 활성화 */
  
  /* 2. 가로로 7칸을 만들겠다는 선언 (중요!) */
  grid-template-columns: repeat(7, 50px); 
  
  /* 3. 세로로 7칸을 만들겠다는 선언 */
  grid-template-rows: repeat(7, 50px); 
  
  gap: 2px; /* 벽돌 사이 간격 */
  border: 4px solid #444;
  padding: 5px;
  background-color: #eee;
  
  /* 애니메이션 시 영역 밖으로 나가는 벽돌 방지 */
  position: relative; 
  width: fit-content;
  margin: 0 auto;
}

/* --- 애니메이션 핵심 (CSS) --- */

/* 1. 벽돌이 부드럽게 이동하는 효과 (Move Transition) */
/* Vue가 요소의 위치 변화를 감지하면 .brick-drop-move 클래스를 자동으로 붙여줌 */
.brick-drop-move {
  transition: transform 0.3s ease-in-out; /* 0.3초 동안 부드럽게 이동 */
}

/* 2. 벽돌이 새로 생성될 때 (Enter Transition) */
.brick-drop-enter-active {
  transition: all 0.3s ease-out;
  transition-delay: 0.1s; /* 살짝 늦게 생성되어 위에서 떨어지는 느낌 */
}
.brick-drop-enter-from {
  opacity: 0;
  transform: translateY(-100px); /* 화면 위쪽에서 시작 */
}
.brick-drop-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 3. 벽돌이 사라질 때 (Leave Transition) */
/* C++의 Delete처럼 즉시 사라지게 처리 (이동 공간 확보) */
.brick-drop-leave-active {
  position: absolute; /* 이동 애니메이션에 방해되지 않도록 절대 위치로 */
}
.score-layout {
    padding: 10px 30px;
    display: flex;
}
.score-board {
  margin-bottom: 1px;
  background: #333;
  color: #fff;
  padding: 5px;
  border-radius: 10px;
  min-width: 150px;
  display: inline-block; 
  height: 70px;
}
.score-label { font-size: 14px; color: #aaa; }
.score-value { font-size: 20px; font-weight: bold; font-family: 'Courier New', Courier, monospace; }
.combo-badge {
  color: #f8f410;
  font-weight: bold;
  font-size: 16px;
  margin-top: 1px;
}
.timer-display {
  padding: 3px 10px;
  font-size: 19px;
  font-weight: bold;
  color: #b68463;
  transition: color 0.3s;
  /*background: #333;  */
  min-width: 200px;
}


/* 콤보 등장 애니메이션 */
.bounce-enter-active { animation: bounce-in 0.5s; }
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}
/* --- 기존 스타일 유지 --- */
.brick-cell {
  /* ... 기존 속성들 ... */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-out; /* 이동 속도는 빠르게 유지 */
}

/* --- 애니메이션 핵심: '펑!' 터지는 효과 --- */

/* 1. 블록이 터져서 사라질 때 (Leave Transition) */
.brick-drop-leave-active {
  position: absolute; /* 이동 애니메이션에 방해되지 않도록 절대 위치로 */
  z-index: 20;       /* 터질 때 가장 위로 올라오게 함 */
  
  /* C++의 Delete처럼 즉시 사라지는 대신, 펑! 애니메이션 실행 */
  animation: pang-explosion 0.4s ease-out; 
}

/* 2. '펑!' 폭발 애니메이션 정의 (Keyframes) */
@keyframes pang-explosion {
  0% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(2) blur(0px); /* 터지기 시작할 때 살짝 밝게 */
  }
  30% {
    transform: scale(1.6); /* 1.6배까지 촥! 커짐 (폭발 느낌) */
    opacity: 1;
    filter: brightness(3) blur(1px); /* 더 밝고 뿌옇게 */
  }
  100% {
    transform: scale(0.5); /* 다시 작아지면서 사라짐 */
    opacity: 0;
    filter: brightness(0) blur(5px); /* 검게 변하며 투명해짐 */
  }
}
/* --- 화면 흔들림 효과 정의 --- */
@keyframes screen-shake {
  0% { transform: translate(1px, 1px) rotate(0deg); }
  10% { transform: translate(-1px, -2px) rotate(-1deg); }
  20% { transform: translate(-3px, 0px) rotate(1deg); }
  30% { transform: translate(3px, 2px) rotate(0deg); }
  40% { transform: translate(1px, -1px) rotate(1deg); }
  50% { transform: translate(-1px, 2px) rotate(-1deg); }
  60% { transform: translate(-3px, 1px) rotate(0deg); }
  70% { transform: translate(3px, 1px) rotate(-1deg); }
  80% { transform: translate(-1px, -1px) rotate(1deg); }
  90% { transform: translate(1px, 2px) rotate(0deg); }
  100% { transform: translate(1px, -2px) rotate(-1deg); }
}

/* 폭발 중일 때 보드에 붙일 클래스 */
.game-board.is-panging {
  animation: screen-shake 0.3s ease-out; /* 0.3초 동안 흔듦 */
  animation-iteration-count: 1; /* 한 번만 */
}
/* 1. 칸(Cell)이 사라질 때는 투명도만 조절 (격자는 유지) */
.brick-drop-leave-active {
  position: absolute;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.3s; /* 칸 자체는 부드럽게 사라짐 */
}

/* 2. 칸이 사라지는 동안 그 안의 '이미지'만 펑! 터지게 함 */
.brick-drop-leave-active .fruit-icon {
  animation: fruit-pang 0.4s ease-out;
}

/* 3. 과일 전용 폭발 애니메이션 */
@keyframes fruit-pang {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  40% {
    transform: scale(2.0); /* 과일만 2배로 확 커짐! */
    filter: brightness(2) contrast(1.5); /* 반짝이는 효과 */
    opacity: 1;
  }
  100% {
    transform: scale(0.2); /* 마지막엔 작아지며 소멸 */
    opacity: 0;
  }
}
/* 과일 뒤에 폭발 광채 추가 (선택 사항) */
.brick-drop-leave-active::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 10px; height: 10px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: shine-out 0.4s ease-out;
  pointer-events: none;
}

@keyframes shine-out {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 80px; height: 80px; opacity: 0; }
}

/* 10초 남았을 때 빨간색으로 강조 */
.low-time {
  color: #ff0000;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.overlay {
  position: absolute;
  top: 50; left: 0;
  width: 73%; height: 50%;
  background: rgba(0,0,0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1; 
}

.start-btn {
  padding: 15px 40px;
  font-size: 20px;
  background: #ffcc00;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: bold;
}
.fruit-icon {
  /* 이미지 드래그 기능 원천 차단 */
  -webkit-user-drag: none; 
  user-select: none;
  pointer-events: none; /* 이미지가 마우스 이벤트를 먹지 않고 부모인 .brick-cell로 통과하게 함 */
}

.brick-cell {
  /* 드래그 중 텍스트 선택 방지 */
  user-select: none;
}
</style>
