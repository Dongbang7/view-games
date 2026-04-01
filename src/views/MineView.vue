<template>
<div class="minesweeper-container" :class="{ 'shake': isShaking }">
    <label class="title">동방 지뢰찾기 : Minesweeper</label>
    <div class="control-bar">
        <div class="mine-selector">
            <label> &nbsp; 게임 지뢰 수 </label>
            <div class="up-down-input">
            <input 
                type="number" 
                v-model.number="tempMineCount" 
                @change="validateCount"
            />
            <div class="button-group">
                <button @click="incrementCount">▲</button>
                <button @click="decrementCount">▼</button>
            </div>
            </div>
        </div>
    </div>
    <div class="game-header">
        <div class="info-panel mines-left">
        {{ String(minesLeft).padStart(3, '0') }}
        </div>
        
        <button class="restart-btn" @click="initGame"> 
         <!-- {{ isGameOver ? '😫' : (isVictory ? '😎' : '🙂') }} -->
         {{ isVictory ? '😎' : (isGameOver ? '😫' : '🙂') }}
        </button>
        
        <div class="info-panel timer">
            {{ String(timer).padStart(3, '0') }}
        </div>
    </div>
    
    <div class="mine-board" 
        :style="{ gridTemplateColumns: `repeat(${WIDTH}, 30px)` }">
    
    <template v-for="(row, rIdx) in board" :key="'r'+rIdx">
        <div v-for="(cell, cIdx) in board[rIdx]" 
            :key="'c'+cIdx"
            class="mine-cell"
            :class="{ 
            'revealed': cell.revealed, 
            'mine': cell.revealed && cell.mine,
            [`text-${cell.neighborCount}`]: cell.revealed && !cell.mine 
            }"
            @click="openCell(rIdx, cIdx)"
            @contextmenu.prevent="toggleFlag(rIdx, cIdx)">
        
        <span v-if="cell.revealed">
            {{ cell.mine ? '💣' : (cell.neighborCount > 0 ? cell.neighborCount : '') }}
        </span>
        <span v-else-if="cell.flagged">🚩</span>
        </div>
    </template>
    </div>
  <!-- <button class="restart-btn" @click="initGame">Restart</button> -->
</div>      
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const WIDTH = 10;
const HEIGHT = 10;
const MINE_COUNT = ref<number>(10);

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  neighborCount: number;
}

const board = ref<Cell[][]>([]);
const isGameOver = ref(false);
const isVictory = ref(false);

// [추가] 애니메이션 및 UI 상태
const isShaking = ref(false); // 화면 흔들림 트리거

// [추가] 실시간 지뢰 카운트 (Computed)
// 설치된 지뢰 수 - 꽂힌 깃발 수
const flaggedCount = computed(() => {
  return board.value.flat().filter(cell => cell.flagged).length;
});
const minesLeft = computed(() => MINE_COUNT.value - flaggedCount.value);

// 1. 상태 변수 선언 (C++의 멤버 변수와 비슷합니다)
const tempMineCount = ref<number>(10); // 화면 표시 및 조작용
//const actualMineCount = ref<number>(10); // 실제 게임 반영용

const MIN_MINES = 5;
const MAX_MINES = 99;

// 2. 값 증가 (TUpDown의 Up 버튼)
const incrementCount = () => {
  if (tempMineCount.value < MAX_MINES) {
    tempMineCount.value++;
  }
};

// 3. 값 감소 (TUpDown의 Down 버튼)
const decrementCount = () => {
  if (tempMineCount.value > MIN_MINES) {
    tempMineCount.value--;
  }
};

// 4. 입력값 유효성 검사 (Edit의 OnChange 느낌)
const validateCount = () => {
  if (tempMineCount.value > MAX_MINES) tempMineCount.value = MAX_MINES;
  if (tempMineCount.value < MIN_MINES) tempMineCount.value = MIN_MINES;
};

const timer = ref(0);
let timerInterval: number | null = null;

// 타이머 시작 함수
const startTimer = () => {
  if (timerInterval) return; // 이미 실행 중이면 중복 실행 방지
  timerInterval = window.setInterval(() => {
    if (timer.value < 999) {
      timer.value++;
    } else {
      stopTimer(); // 999초가 넘으면 정지
    }
  }, 1000);
};

// 타이머 정지 함수
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// 1. 보드 초기화 및 지뢰 매립
const initGame = () => {
  stopTimer();
  timer.value = 0;
  MINE_COUNT.value = tempMineCount.value;
  isGameOver.value = false;
  isVictory.value = false;
  isShaking.value = false;
  // 빈 보드 생성
  const newBoard: Cell[][] = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      neighborCount: 0,
    }))
  );

  // 지뢰 랜덤 배치
  let minesPlanted = 0;
  while (minesPlanted < MINE_COUNT.value) {
    const r = Math.floor(Math.random() * HEIGHT);
    const c = Math.floor(Math.random() * WIDTH);
    if (!newBoard[r]![c]!.mine) {
      newBoard[r]![c]!.mine = true;
      minesPlanted++;
    }
  }

  // 주변 지뢰 개수 계산 (빌더의 OnCreate 시점)
  for (let r = 0; r < HEIGHT; r++) {
    for (let c = 0; c < WIDTH; c++) {
      if (newBoard[r]![c]!.mine) continue;
      let count = 0;
      // 주변 8방향 탐색
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < HEIGHT && nc >= 0 && nc < WIDTH && newBoard[nr]![nc]!.mine) {
            count++;
          }
        }
      }
      newBoard[r]![c]!.neighborCount = count;
    }
  }
  board.value = newBoard;
};

// 2. 칸 클릭 (왼쪽 클릭)
const openCell = (r: number, c: number) => {
  if (isGameOver.value || board.value[r]![c]!.revealed || board.value[r]![c]!.flagged) return;

  // 게임 중 첫 클릭이면 타이머 시작 (빌더의 첫 Event 발생 시점)
  if (timer.value === 0 && !isGameOver.value) {
    startTimer();
  }

  board.value[r]![c]!.revealed = true;

  if (board.value[r]![c]!.mine) {
    stopTimer(); // 지뢰 밟으면 타이머 정지
    playCombineSound();
    gameOver(false); // 패배
    //isGameOver.value = true;
    //alert("펑! 게임 오버!"); // 나중에 흔들림 효과 넣을 자리!
    return;
  }

  // [핵심] 빈 칸(0)인 경우 주변 자동 오픈 (Flood Fill)
  if (board.value[r]![c]!.neighborCount === 0) {
    revealEmpty(r, c);
  }
  // 승리 조건 체크
  checkVictory();
};

// 3. 재귀적으로 주변 빈 칸 열기
const revealEmpty = (r: number, c: number) => {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < HEIGHT && nc >= 0 && nc < WIDTH && !board.value[nr]![nc]!.revealed) {
        openCell(nr, nc); // 재귀 호출!
      }
    }
  }
};

// 4. 깃발 꽂기 (오른쪽 클릭)
const toggleFlag = (r: number, c: number) => {
  if (isGameOver.value || board.value[r]![c]!.revealed) return;
  board.value[r]![c]!.flagged = !board.value[r]![c]!.flagged;
};

// [추가] 게임 오버 처리 (패배/승리)
const gameOver = (win: boolean) => {
  isGameOver.value = true;
  
  if (!win) {
    // [핵심] 패배 시 화면 흔들림 애니메이션 시작
    isShaking.value = true;
    // 0.5초 후 애니메이션 클래스 제거 (재사용을 위해)
    setTimeout(() => { isShaking.value = false; }, 500); 

    // 모든 지뢰 공개
    board.value.flat().forEach(cell => {
      if (cell.mine) cell.revealed = true;
    });
  }
};

// 승리 조건 체크
const checkVictory = () => {
  const revealedCount = board.value.flat().filter(cell => cell.revealed && !cell.mine).length;
  const nonMineCount = WIDTH * HEIGHT - MINE_COUNT.value;
  
  if (revealedCount === nonMineCount) {
    stopTimer(); // 승리하면 타이머 정지
    isVictory.value = true;
    gameOver(true); // 승리
  }
};


// 사운드 객체 생성 (컴포넌트 상단에 한 번만 선언)
// public/sounds/pop.mp3 경로에 파일이 있다고 가정합니다.
const combineSound = new Audio(`${import.meta.env.BASE_URL}sounds/boom.mp3`);

// 사운드 재생 함수
const playCombineSound = () => {
  // 재생 중일 때 다시 호출되면 처음부터 다시 재생 (연속 합치기 대응)
  combineSound.currentTime = 0; 
  combineSound.volume = 0.2;
  combineSound.play().catch(e => {
    // 브라우저 정책상 첫 상호작용 전에는 재생이 차단될 수 있음
    console.log("사운드 재생 차단됨:", e);
  });
};



onMounted(initGame);
</script>

<style scoped>
/* 전체 컨테이너: 빌더의 메인 폼처럼 중앙 정렬 */
.minesweeper-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #bdbdbd; /* 클래식 회색 */
  padding: 15px;
  border: 3px solid;
  border-color: #eeeeee #7b7b7b #7b7b7b #eeeeee; /* 입체적 테두리 */
  user-select: none; /* 텍스트 선택 방지 */
  margin: 20px auto;
  width: fit-content;
}

/* 게임 보드: CSS Grid로 바둑판 고정 */
.mine-board {
  /*display: inline-grid; /* 기본 grid는 부모의 너비를 100% 차지하려고 하지만, inline-grid는 내용물만큼만 너비를 차지 -> 안됨. */
  display: grid; 
  /* 스크립트의 WIDTH 값에 맞춰 자동으로 칸을 나눕니다 */
  grid-template-columns: repeat(10, 30px); 
  grid-template-rows: repeat(10, 30px);
  /* 가로 칸 수만큼 30px 크기의 열을 만듭니다. */
  /* 아래 template에서 :style로 WIDTH값을 받아올 거예요. */
  gap: 2px; 
  width: min-content; /* [추가] 자식들의 크기만큼만 너비를 가집니다 */
  background-color: #7b7b7b;
  border: 3px solid;
  border-color: #7b7b7b #eeeeee #eeeeee #7b7b7b; /* 보드 안쪽으로 들어간 느낌 */
  padding: 1px;
}
/* mine-row는 이제 필요 없으므로 제거하거나 display: contents 처리합니다. */
.mine-row {
  display: contents; 
}

/* 개별 칸 스타일 (기본: 튀어나온 느낌) */
.mine-cell {
  width: 30px;
  height: 30px;
  background-color: #8b8888;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  cursor: pointer;
  border: 3px solid;
  border-color: #eeeeee #9c9b9b #7b7b7b #726767; /* Raised 효과 */
}

/* 열린 칸 스타일 (안으로 쑥 들어간 느낌) */
.mine-cell.revealed {
  border: 1px solid #7b7b7b; /* 얇은 선으로 변경 */
  background-color: #d1d1d1;
}

/* 지뢰가 터졌을 때 */
.mine-cell.mine {
  background-color: #ff0000;
}

/* 숫자별 색상 (클래식 지뢰찾기 국룰 색상) */
.text-1 { color: blue; }
.text-2 { color: green; }
.text-3 { color: red; }
.text-4 { color: darkblue; }
.text-5 { color: darkred; }
.text-6 { color: teal; }
.text-7 { color: black; }
.text-8 { color: gray; }

/* 하단 버튼 */
/*.restart-btn {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: #bdbdbd;
  border: 2px solid;
  border-color: #eeeeee #7b7b7b #7b7b7b #eeeeee;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  font-size: 21px;
}
.restart-btn:active {
  border-color: #7b7b7b #eeeeee #eeeeee #7b7b7b;
}*/
.title {
    display: flex;
    align-items: center;
    margin: 5px;
    color: rgb(83, 71, 194);
    font-size: 14px;
}
/* [추가] 상단 UI 바 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: #bdbdbd;
  padding: 5px;
  margin-bottom: 10px;
  border: 2px solid;
  border-color: #7b7b7b #eeeeee #eeeeee #7b7b7b; /* 입체적 효과 */
}

.info-panel {
  background-color: black;
  color: red; /* 클래식 디지털 숫자 느낌 */
  font-family: 'DSEG7-Classic', 'Courier New', monospace; /* 디지털 폰트가 있다면 좋고, 없으면 monospace */
  font-size: 24px;
  padding: 2px 5px;
  border: 2px solid;
  border-color: #7b7b7b #eeeeee #eeeeee #7b7b7b;
  min-width: 60px;
  text-align: right;
}

.restart-btn {
  font-size: 23px;
  padding: 5px 40px;
  background-color: #bdbdbd;
  border: 2px solid;
  border-color: #eeeeee #7b7b7b #7b7b7b #eeeeee;
  cursor: pointer;
}
.restart-btn:active {
  border-color: #7b7b7b #eeeeee #eeeeee #7b7b7b;
}

/* [핵심] Shake 애니메이션 정의 */
@keyframes shakeAnimation {
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

/* shake 클래스가 붙으면 0.5초간 애니메이션 실행 */
.minesweeper-container.shake {
  animation: shakeAnimation 0.5s; 
  animation-iteration-count: 1; /* 한 번만 실행 */
}
.control-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 1px;
  background-color: #6b6868;
  border-bottom: 1px solid #ccc;
}

.up-down-input {
  display: inline-flex;
  border: 1px solid #6b6868;
  background: rgb(119, 118, 118);
}

.up-down-input input {
  width: 50px;
  border: none;
  text-align: center;
  color : white;
  outline: none;
  background: rgb(131, 131, 131);
}

/* 숫자 입력창 기본 화살표 숨기기 */
.up-down-input input::-webkit-inner-spin-button {
  appearance: none;
}

.button-group {
  display: flex;
  flex-direction: column;
  border-left: 1px solid #999;
}

.button-group button {
  padding: 0 5px;
  font-size: 8px;
  height: 15px;
  cursor: pointer;
  border: none;
  background: #eee;
}

.button-group button:hover {
  background: #ddd;
}
</style>