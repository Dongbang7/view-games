<template>
  <div class="game-wrapper">
    <div class="game-header">
      <div class="title">동방 2048</div>
      <div class="score-container">
        <div class="score-box">SCORE<div>{{ score }}</div></div>
        <div class="score-box">BEST<div>{{ bestScore }}</div></div>
      </div>
    </div>

    <div class="game-intro">
      <button @click="initGame" class="restart-button">New Game</button>
    </div>

    <div class="grid-container" 
         @touchstart.prevent="handleTouchStart" 
         @touchend.prevent="handleTouchEnd">
      <div v-for="i in 16" :key="'bg-'+i" class="grid-cell"></div>

      <transition-group name="tile-move">
        <div v-for="tile in tiles" 
             :key="tile.id" 
             class="tile" 
             :class="['tile-' + tile.value, getPositionClass(tile.row, tile.col)]"
             :data-merged="tile.merged">
          <div class="tile-inner">{{ tile.value }}</div>
        </div>
      </transition-group>

      <div v-if="isGameOver" class="game-message">
        <p>Game Over!</p>
        <button @click="initGame">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// 타일 객체 정의 (애니메이션을 위해 id와 merged 상태 추가)
interface Tile {
  id: number;
  row: number;
  col: number;
  value: number;
  merged?: boolean; // 합쳐진 타일인지 표시
}

const tiles = ref<Tile[]>([]);
const score = ref(0);
const bestScore = ref(Number(localStorage.getItem('2048-best')) || 0);
const isGameOver = ref(false);
let tileIdCounter = 0; // 고유 ID 생성을 위한 카운터

// 1. 게임 시작 (숫자 2개 생성)
const initGame = () => {
  tiles.value = [];
  score.value = 0;
  isGameOver.value = false;
  addRandomTile();
  addRandomTile();
};

// 2. 랜덤 위치에 2 또는 4 추가
const addRandomTile = () => {
  const occupied = new Set(tiles.value.map(t => `${t.row},${t.col}`));
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!occupied.has(`${r},${c}`)) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length > 0) {
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
    tiles.value.push({
      id: tileIdCounter++,
      row: r,
      col: c,
      value: Math.random() < 0.9 ? 2 : 4
    });
  }
};

// 3. 이동 및 합치기 로직 (유리님 전용: 회전 기반 단순화 버전)
const move = (direction: string) => {
  if (isGameOver.value) return;
  let moved = false;
  let currentTiles = JSON.parse(JSON.stringify(tiles.value)) as Tile[];
  const mergedIds = new Set<number>();
  let hasMerged = false; // 이번 이동에서 합쳐짐이 발생했는지 체크

  // 그리드 회전 함수 (로직 단순화를 위함)
  const rotate = (ts: Tile[]) => {
    return ts.map(t => ({ ...t, row: t.col, col: 3 - t.row }));
  };

  // 방향에 따라 그리드 회전 (모든 로직을 '왼쪽 이동' 하나로 통일)
  let rotations = direction === 'left' ? 0 : direction === 'up' ? 1 : direction === 'right' ? 2 : 3;
  for (let i = 0; i < rotations; i++) currentTiles = rotate(currentTiles);

  // '왼쪽 이동' 로직 수행
  for (let r = 0; r < 4; r++) {
    let rowTiles = currentTiles.filter(t => t.row === r).sort((a, b) => a.col - b.col);
    
    let nextCol = 0;
    for (let i = 0; i < rowTiles.length; i++) {
      const currentTile = rowTiles[i];
      
      // 앞으로 밀기
      if (currentTile!.col !== nextCol) {
        currentTile!.col = nextCol;
        moved = true;
      }

      // 합치기 체크
      if (i < rowTiles.length - 1 && currentTile!.value === rowTiles[i + 1]!.value) {
        currentTile!.value *= 2;
        score.value += currentTile!.value;
        currentTile!.merged = true; // 합쳐짐 표시 (애니메이션용)
        mergedIds.add(rowTiles[i + 1]!.id); // 사라질 타일 ID 저장

        hasMerged = true; // 합쳐졌음을 표시

        i++; // 다음 타일 스킵
        moved = true;
      }
      nextCol++;
    }
  }

  // 다시 원래 방향으로 회전
  for (let i = 0; i < (4 - rotations) % 4; i++) currentTiles = rotate(currentTiles);

  if (moved) {
    // 1. 합쳐져서 사라질 타일들을 제거
    tiles.value = currentTiles.filter(t => !mergedIds.has(t.id));
    // 타일이 합쳐졌다면 사운드 실행!
    if (hasMerged) {
      playCombineSound();
    }

    addRandomTile();
    checkGameOver();
    
    // 베스트 스코어 갱신
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      localStorage.setItem('2048-best', bestScore.value.toString());
    }
  }
};

// 사운드 객체 생성 (컴포넌트 상단에 한 번만 선언)
// public/sounds/pop.mp3 경로에 파일이 있다고 가정합니다.
const combineSound = new Audio(`${import.meta.env.BASE_URL}sounds/pop.mp3`);

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

// ... (키보드/터치 이벤트는 동일하므로 생략, 유리님 코드를 유지하세요) ...
// handleKeyDown, handleTouchStart, handleTouchEnd 등
//--- 폰에서 조작용
// 터치 시작 위치 저장을 위한 변수
let touchStartX = 0;
let touchStartY = 0;

// 1. 터치 시작 (손가락을 화면에 댈 때)
const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0]!.clientX;
  touchStartY = e.touches[0]!.clientY;
  // 스크롤 방지 (게임판 위에서 화면이 움직이지 않게)
  e.preventDefault();
};

// 2. 터치 종료 (손가락을 화면에서 뗄 때)
const handleTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0]!.clientX;
  const touchEndY = e.changedTouches[0]!.clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // 최소 스와이프 거리 (너무 살짝 건드린 건 무시)
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) > 30) {
    // 수평 이동이 더 크면 좌우 이동
    if (absDx > absDy) {
      move(dx > 0 ? 'right' : 'left');
    } 
    // 수직 이동이 더 크면 상하 이동
    else {
      //move(dy > 0 ? 'down' : 'up');
      move(dy > 0 ? 'up' : 'down');
    }
  }
};
//=== 폰

// 키보드/터치 이벤트 생략 (위 답변과 동일)
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') move('left');
  if (e.key === 'ArrowRight') move('right');
  if (e.key === 'ArrowUp') move('down');
  if (e.key === 'ArrowDown') move('up');
};


const getPositionClass = (row: number, col: number) => `pos-${row}-${col}`;

const checkGameOver = () => {
  // 1. 현재 타일 상태를 4x4 가상 그리드(매트릭스)로 변환
  const matrix: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
  tiles.value.forEach(t => {
    matrix[t.row]![t.col] = t.value;
  });

  // 2. 빈 칸이 하나라도 있으면 게임 오버 아님
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (matrix[r]![c] === 0) return; 
    }
  }

  // 3. 인접한 타일끼리 합칠 수 있는지 확인 (가로/세로 상하좌우)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const current = matrix[r]![c];
      
      // 오른쪽 타일과 같은지 체크
      if (c < 3 && current === matrix[r]![c + 1]) return;
      // 아래쪽 타일과 같은지 체크
      if (r < 3 && current === matrix[r + 1]![c]) return;
    }
  }

  // 모든 검사를 통과하지 못하면(빈칸 없고 합칠 곳 없으면) 게임 오버!
  isGameOver.value = true;
};

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* 유리님을 위한 기술 노트: 애니메이션의 핵심 CSS */

.game-wrapper { font-family: 'Clear Sans', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; padding-top: 20px; }
.game-header { width: 340px; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 35px; font-weight: bold; color: #776e65; }
.score-container { display: flex; gap: 5px; }
.score-box { background: #bbada0; color: white; padding: 5px 15px; border-radius: 3px; text-align: center; font-weight: bold; }

.grid-container { 
  width: 340px; height: 340px; background: #bbada0; border-radius: 6px; padding: 10px; 
  display: grid; grid-template-rows: repeat(4, 1fr); grid-template-columns: repeat(4, 1fr); gap: 10px; position: relative;
}
/* 배경 셀 (움직이지 않음) */
.grid-cell { background: rgba(238, 228, 218, 0.35); border-radius: 3px; }

/* 움직이는 타일 (절대 좌표) */
.tile { 
  position: absolute; width: 72.5px; height: 72.5px; /* (340 - 10*2 - 10*3) / 4 */
  background: rgba(238, 228, 218, 0.35); border-radius: 3px; 
  display: flex; justify-content: center; align-items: center; font-size: 35px; font-weight: bold;
  
  /* 부드러운 이동을 위한 트랜지션 (핵심) */
  transition: transform 0.1s ease-in-out, background-color 0.1s;
  will-change: transform; /* GPU 가속 유도 */
}

/* 💡 위치별 좌표 매핑 (예: pos-0-0 -> translate(0, 0)) */
/* gap 10px와 타일 크기 72.5px를 고려하여 계산 */
.pos-0-0 { transform: translate(10px, 10px); }
.pos-0-1 { transform: translate(92.5px, 10px); }
.pos-0-2 { transform: translate(175px, 10px); }
.pos-0-3 { transform: translate(257.5px, 10px); }

.pos-1-0 { transform: translate(10px, 92.5px); }
.pos-1-1 { transform: translate(92.5px, 92.5px); }
.pos-1-2 { transform: translate(175px, 92.5px); }
.pos-1-3 { transform: translate(257.5px, 92.5px); }

.pos-2-0 { transform: translate(10px, 175px); }
.pos-2-1 { transform: translate(92.5px, 175px); }
.pos-2-2 { transform: translate(175px, 175px); }
.pos-2-3 { transform: translate(257.5px, 175px); }

.pos-3-0 { transform: translate(10px, 257.5px); }
.pos-3-1 { transform: translate(92.5px, 257.5px); }
.pos-3-2 { transform: translate(175px, 257.5px); }
.pos-3-3 { transform: translate(257.5px, 257.5px); }


/* 합쳐지는 효과 (scale) */
.tile[data-merged="true"] .tile-inner {
  animation: mergePop 0.2s ease-in-out;
}

@keyframes mergePop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* 타일별 색상 (유리님 스타일 유지) */
.tile-2 { background: #eee4da; color: #776e65; }
.tile-4 { background: #ede0c8; color: #776e65; }
.tile-8 { background: #f2b179; color: white; }
.tile-16 { background: #f59563; color: white; }
.tile-32 { background: #f67c5f; color: white; }
.tile-64 { background: #f65e3b; color: white; }
.tile-128 { background: #edcf72; color: white; font-size: 20px; }
.tile-2048 { background: #edc22e; color: white; box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.23); }

.restart-button {
  background: #8f7a66; color: white; border: none; padding: 10px 20px; 
  border-radius: 3px; cursor: pointer; font-weight: bold; margin-bottom: 20px;
}
.game-message {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(238, 228, 218, 0.73);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  z-index: 100;
  animation: fadeIn 0.5s ease-in; 
}

.game-message p {
  font-size: 40px;
  font-weight: bold;
  color: #776e65;
  margin-bottom: 20px;
}

.game-message button {
  background: #8f7a66;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 18px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
