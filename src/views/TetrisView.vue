<template>
  <div class="tetris-wrapper">
    <div class="tetris-header">
      <div class="score-container">
        <div class="score-box">SCORE<div>{{ score }}</div></div>
        <div class="score-box">BEST<div>{{ bestScore }}</div></div>
      </div>
    <div class="next-container">
      <div class="next-label">NEXT</div>
      <div class="next-preview">
        <div v-for="(row, rIdx) in nextPiece.matrix" :key="'nr-'+rIdx" class="next-row">
            <div v-for="(cell, cIdx) in row" :key="'nc-'+cIdx" 
                class="cell small-cell" 
                :class="cell !== 0 ? 'tile-' + cell : ''">
            </div>
        </div>
      </div>
    </div>
    <div class="tetris-intro">
      <div class="title">DongBang Tetris</div>
      <button @click="initGame" class="restart-button">NewGame</button>
    </div>
    </div>

    <div class="board-container" 
        @touchstart.prevent="handleTouchStart" 
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="handleTouchEnd">
      <div v-for="(row, rIdx) in displayBoard" :key="'r-'+rIdx" class="board-row">
        <div v-for="(cell, cIdx) in row" :key="'c-'+cIdx" 
             class="cell" 
             :class="[
               cell !== 0 ? 'tile-' + String(cell).split('-')[0] : '', 
               String(cell).includes('destroy') ? 'tile-destroy' : ''
             ]">
        </div>
      </div>

      <div v-for="popUp in scorePopUps" :key="'pop-'+popUp.id" 
           class="score-popup" 
           :style="getPopUpStyle(popUp.r)">
        {{ popUp.text }}
      </div>

      <div v-if="isGameOver" class="game-message">
        <p>Game Over!</p>
        <button @click="initGame">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// 블록 모양 정의 (문자열 대신 숫자로 매핑하여 색상 처리 용이하게 변경)
const SHAPES: Record<string, number[][]> = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  J: [[2,0,0],[2,2,2],[0,0,0]],
  L: [[0,0,3],[3,3,3],[0,0,0]],
  O: [[4,4],[4,4]],
  S: [[0,5,5],[5,5,0],[0,0,0]],
  T: [[0,6,0],[6,6,6],[0,0,0]],
  Z: [[7,7,0],[0,7,7],[0,0,0]]
};
const TYPES = Object.keys(SHAPES);

//const board = ref<number[][]>(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)));
// number 또는 string이 들어올 수 있는 2차원 배열로 선언
const board = ref<(number | string)[][]>(
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
);
const currentPiece = ref({ matrix: [[0]], row: 0, col: 0, type: '' });
const score = ref(0);
const bestScore = ref(Number(localStorage.getItem('tetris-best')) || 0);
const isGameOver = ref(false);
let gameInterval: any = null;

// [핵심] 현재 움직이는 블록을 보드 데이터와 합쳐서 보여주는 계산된 속성
const displayBoard = computed(() => {
  const display = board.value.map(row => [...row]);
  if (currentPiece.value && !isGameOver.value) {
    const { matrix, row, col } = currentPiece.value;
    matrix.forEach((r, y) => {
      r.forEach((value, x) => {
        if (value !== 0) {
          const br = row + y;
          const bc = col + x;
          if (br >= 0 && br < BOARD_HEIGHT && bc >= 0 && bc < BOARD_WIDTH) {
            display[br]![bc] = value;
          }
        }
      });
    });
  }
  return display;
});

/* 이건 다음 블럭을 안보여주는 방식.
const spawnPiece = () => {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const matrix = SHAPES[type];
  currentPiece.value = {
    type,
    matrix: JSON.parse(JSON.stringify(matrix)),
    row: 0,
    col: Math.floor((BOARD_WIDTH - matrix[0].length) / 2)
  };
  if (checkCollision(currentPiece.value.row, currentPiece.value.col, currentPiece.value.matrix)) {
    isGameOver.value = true;
    clearInterval(gameInterval);
  }
};
*/
// 3. 블록이 바닥에 닿았을 때 호출되는 spawnPiece 수정
const spawnPiece = () => {
  // 다음 블록을 현재 블록으로 가져오기
  const type = nextPiece.value.type;
  const matrix = nextPiece.value.matrix;

  currentPiece.value = {
    type,
    matrix: JSON.parse(JSON.stringify(matrix)),
    row: 0,
    col: Math.floor((BOARD_WIDTH - matrix[0]!.length) / 2)
  };

  // 새로운 '다음 블록' 미리 뽑아두기
  const newNextType = TYPES[Math.floor(Math.random() * TYPES.length)]!;
  nextPiece.value = {
    type: newNextType,
    matrix: JSON.parse(JSON.stringify(SHAPES[newNextType!]))
  };

  if (checkCollision(currentPiece.value.row, currentPiece.value.col, currentPiece.value.matrix)) {
    isGameOver.value = true;
    clearInterval(gameInterval);
  }
};
const checkCollision = (r: number, c: number, m: number[][]) => {
  return m.some((row, y) => row.some((val, x) => {
    if (val === 0) return false;
    const br = r + y, bc = c + x;
    return br >= BOARD_HEIGHT || bc < 0 || bc >= BOARD_WIDTH || (br >= 0 && board.value[br]![bc] !== 0);
  }));
};

/*
const move = (dr: number, dc: number) => {
  if (!checkCollision(currentPiece.value.row + dr, currentPiece.value.col + dc, currentPiece.value.matrix)) {
    currentPiece.value.row += dr;
    currentPiece.value.col += dc;
    return true;
  }
  if (dr > 0) lockPiece();
  return false;
};
*/

const rotate = () => {
  const m = currentPiece.value.matrix;
  const rotated: number[][] = m[0]!.map((_, i) => m.map(row => row[i]!).reverse());
  // 2. 충돌 체크 후 대입
  if (!checkCollision(currentPiece.value.row, currentPiece.value.col, rotated)) {
    currentPiece.value.matrix = rotated;
  }
};

/*
const lockPiece = () => {
  currentPiece.value.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        const br = currentPiece.value.row + y;
        if (br >= 0) board.value[br][currentPiece.value.col + x] = val;
      }
    });
  });
  clearLines();
  spawnPiece();
};
*/

const lockPiece = () => {
  // 1. 현재 블록의 모양(matrix)을 보드(board) 데이터에 '박제'합니다.
  currentPiece.value.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val !== 0) {
        const br = currentPiece.value.row + y;
        const bc = currentPiece.value.col + x;
        // 보드 범위 안에 있을 때만 저장 (안전 장치)
        if (br >= 0 && br < BOARD_HEIGHT && bc >= 0 && bc < BOARD_WIDTH) {
          board.value[br]![bc] = val; // 여기서 숫자가 박혀야 화면에 남습니다!
        }
      }
    });
  });

  // 2. 줄이 꽉 찼는지 확인하고 지우기
  clearLines();

  // 3. 새 블록 소환
  spawnPiece();
};

const move = (dr: number, dc: number) => {
  if (isGameOver.value) return false;

  const nextRow = currentPiece.value.row + dr;
  const nextCol = currentPiece.value.col + dc;

  // 다음 위치가 충돌인지 확인
  if (!checkCollision(nextRow, nextCol, currentPiece.value.matrix)) {
    currentPiece.value.row = nextRow;
    currentPiece.value.col = nextCol;
    return true;
  } else {
    // 만약 '아래'로 가려다가 부딪힌 거라면? 바닥이나 다른 블록에 닿은 것!
    if (dr > 0) {
      lockPiece(); // 여기서 반드시 lockPiece를 호출해야 블록이 바닥에 '착' 붙습니다.
    }
    return false;
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


/*
const clearLines = () => {
  let cleared = 0;
  board.value = board.value.filter(row => {
    const isFull = row.every(cell => cell !== 0);
    if (isFull) cleared++;
    return !isFull;
  });
  while (board.value.length < BOARD_HEIGHT) {
    board.value.unshift(Array(BOARD_WIDTH).fill(0));
  }
  if (cleared > 0) score.value += cleared * 100;
};
*/
/*
const initGame = () => {
  board.value = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  score.value = 0;
  isGameOver.value = false;
  spawnPiece();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => move(1, 0), 1000);
};
*/
/*
const initGame = () => {
  // 1. [중요] 기존에 돌아가던 타이머가 있다면 확실히 죽입니다.
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  // 2. 보드 및 상태 초기화
  board.value = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  score.value = 0;
  isGameOver.value = false;
  
  // 3. 첫 블록 생성
  spawnPiece();
  
  // 4. 새 타이머 시작
  gameInterval = setInterval(() => {
    if (!isGameOver.value) {
      move(1, 0);
    }
  }, 1000);
};
*/
// 1. 다음에 나올 블록 상태 추가
const nextPiece = ref({ matrix: [[0]], type: '' });

const initGame = () => {
  // 1. [가장 중요] 기존에 돌던 타이머가 있다면 즉시 정지하고 비웁니다.
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  // 2. 게임 상태 완전히 초기화 (빌더의 폼 초기화와 같습니다)
  isGameOver.value = false;
  score.value = 0;
  
  // 3. 보드판을 깨끗한 빈 배열로 새로 만듭니다. (깊은 복사 효과)
  board.value = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
  
  // 4. 현재 조작 중인 블록 정보를 초기화합니다.
  // 이 부분이 빠지면 이전 게임의 위치 정보가 새 게임에 영향을 줄 수 있습니다.
  currentPiece.value = { 
    matrix: [[0]], 
    row: 0, 
    col: 0, 
    type: '' 
  };

  // 5. 첫 번째 블록을 생성합니다.
  spawnPiece();

  // 6. 새로운 타이머를 시작합니다.
//   gameInterval = setInterval(() => {
//     // 게임 오버가 아닐 때만 하강 로직을 수행합니다.
//     if (!isGameOver.value) {
//       move(1, 0);
//     }
//   }, 1000);

  // 첫 번째 블록과 다음 블록을 각각 생성
  const firstType = TYPES[Math.floor(Math.random() * TYPES.length)] ?? 'I';
  const secondType = TYPES[Math.floor(Math.random() * TYPES.length)] ?? 'I';
  
  // 현재 조작할 블록 설정
  currentPiece.value = {
    type: firstType,
    matrix: JSON.parse(JSON.stringify(SHAPES[firstType!])),
    row: 0,
    col: Math.floor((BOARD_WIDTH - SHAPES[firstType]![0]!.length) / 2)
  };

  // 다음에 나올 블록 설정
  nextPiece.value = {
    type: secondType,
    matrix: JSON.parse(JSON.stringify(SHAPES[secondType!]))
  };

  // 타이머 시작 등...
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => { if (!isGameOver.value) move(1, 0); }, 1000);
};  


// 블록 이동 로직
const movePiece = (dr: number, dc: number) => {
  if (!currentPiece.value || isGameOver.value) return false;
  const newRow = currentPiece.value.row + dr;
  const newCol = currentPiece.value.col + dc;
  
  if (!checkCollision(newRow, newCol, currentPiece.value.matrix)) {
    currentPiece.value.row = newRow;
    currentPiece.value.col = newCol;
    return true; // 이동 성공
  }
  return false; // 이동 실패 (충돌)
};

// 하드 드롭 (한 번에 바닥으로)
const hardDrop = () => {
  // 충돌할 때까지 아래로 계속 이동
  while (!checkCollision(currentPiece.value.row + 1, currentPiece.value.col, currentPiece.value.matrix)) {
    currentPiece.value.row++;
  }
  // 바닥에 닿았으니 고정!
  lockPiece();
};

// 키보드 및 터치 이벤트 (이전과 동일하게 유지)
const handleKeyDown = (e: KeyboardEvent) => {
  if (isGameOver.value) return;

  // 방향키와 스페이스바를 누를 때 브라우저의 기본 스크롤 동작을 막습니다.
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault(); 
  }

  if (e.key === 'ArrowLeft') move(0, -1);
  if (e.key === 'ArrowRight') move(0, 1);
  if (e.key === 'ArrowDown') move(1, 0);
  if (e.key === 'ArrowUp') rotate();
  //if (e.key === ' ') hardDrop(); // 하드 드롭 (스페이스바)
  // 스페이스바 (Hard Drop)
  if (e.key === ' ') {
    e.preventDefault(); // 브라우저 스크롤 방지
    hardDrop();
  }
};

//--- 폰 터치 스와이프 처리부
// 터치 시작 위치 저장을 위한 상태
/* 이건 1칸씩만 움직이는 방식: 게임하기 답답함.
const touchStart = ref({ x: 0, y: 0 });
const SWIPE_THRESHOLD = 30; // 스와이프로 인정할 최소 거리 (픽셀)

// 터치 시작 (Finger Down)
const handleTouchStart = (e: TouchEvent) => {
  touchStart.value = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };
};

// 터치 종료 (Finger Up) - 여기서 방향을 판정합니다.
const handleTouchEnd = (e: TouchEvent) => {
  if (isGameOver.value) return;

  const touchEnd = {
    x: e.changedTouches[0].clientX,
    y: e.changedTouches[0].clientY
  };

  const dx = touchEnd.x - touchStart.value.x;
  const dy = touchEnd.y - touchStart.value.y;

  // 가로/세로 중 어느 방향으로 더 많이 움직였는지 판정
  if (Math.abs(dx) > Math.abs(dy)) {
    // 가로 스와이프 (좌/우 이동)
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) move(0, 1);  // 오른쪽
      else move(0, -1);       // 왼쪽
    }
  } else {
    // 세로 스와이프 (회전/하강)
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      if (dy > 0) move(1, 0);  // 아래로 (소프트 드롭)
      else rotate();           // 위로 (회전)
    }
  }
};
*/

// 이건 스와이프 한 만큼 움직이게.
// 터치 제어를 위한 상태 변수
const lastTouch = ref({ x: 0, y: 0 });
const moveThreshold = 25; // 블록 1칸 크기(25px)만큼 움직였을 때 이동 처리
const lastTouchTime = ref(0); // 마지막 터치 시간을 저장

const handleTouchStart = (e: TouchEvent) => {
  lastTouch.value = {
    x: e.touches[0]!.clientX,
    y: e.touches[0]!.clientY
  };

  const currentTime = new Date().getTime();
  const gap = currentTime - lastTouchTime.value;

  // 300ms 이내에 다시 터치했다면 더블 터치로 판정
  if (gap > 0 && gap < 300) {
    hardDrop(); // 블록을 바닥으로 즉시 내리는 함수 호출
    lastTouchTime.value = 0; // 판정 후 초기화
  } else {
    lastTouchTime.value = currentTime;
  }
};
/*
const handleTouchMove = (e: TouchEvent) => {
  if (isGameOver.value || !currentPiece.value) return;

  const currentTouch = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  };

  const dx = currentTouch.x - lastTouch.x;
  const dy = currentTouch.y - lastTouch.y;

  // 1. 좌우 이동 (가로로 25px 이상 움직였다면)
  if (Math.abs(dx) > moveThreshold) {
    const steps = Math.floor(dx / moveThreshold); // 몇 칸 움직여야 하는지 계산
    if (steps !== 0) {
      move(0, steps > 0 ? 1 : -1); // 한 칸씩 이동 함수 호출
      lastTouch.value.x = currentTouch.x; // 기준점 갱신 (중요!)
    }
  }

  // 2. 아래로 이동 (세로로 25px 이상 내려갔다면)
  if (dy > moveThreshold) {
    move(1, 0); // 소프트 드롭
    lastTouch.value.y = currentTouch.y; // 기준점 갱신
  }
};
원인은 lastTouch.value.x를 참조하는 방식에 있습니다. ref 객체를 사용할 때는 내부의 값을 가져오기 위해 반드시 .value를 붙여야 하는데, 계산식에서 이를 빠뜨리면 좌표가 갱신되지 않아 블록이 "나 안 움직여!" 하고 버티게 됩니다.
*/
const handleTouchMove = (e: TouchEvent) => {
  if (isGameOver.value || !currentPiece.value) return;

  const currentTouch = {
    x: e.touches[0]!.clientX,
    y: e.touches[0]!.clientY
  };

  // 1. [중요] .value를 붙여서 실제 저장된 좌표값을 가져옵니다.
  const dx = currentTouch.x - lastTouch.value.x;
  const dy = currentTouch.y - lastTouch.value.y;

  // 2. 가로 이동 판정 (25px 이상 쓸었을 때)
  if (Math.abs(dx) > moveThreshold) {
    const direction = dx > 0 ? 1 : -1;
    move(0, direction);
    
    // 이동 후 현재 위치를 새로운 기준점으로 갱신 (반드시 .value에 저장)
    lastTouch.value.x = currentTouch.x; 
    lastTouch.value.y = currentTouch.y; // 대각선 이동 방지를 위해 y도 같이 갱신
  }

  // 3. 세로 이동 판정 (아래로 25px 이상 내렸을 때)
  if (dy > moveThreshold) {
    move(1, 0); // 소프트 드롭
    
    // 기준점 갱신
    lastTouch.value.y = currentTouch.y;
    lastTouch.value.x = currentTouch.x;
  }
};
const handleTouchEnd = (e: TouchEvent) => {
  // 터치가 끝났을 때 '위로 짧게 튕기기'를 감지해서 회전(Rotate) 처리
  // (움직임이 거의 없이 끝났을 때만 회전시키고 싶다면 여기에 로직 추가)
  const dy = e.changedTouches[0]!.clientY - lastTouch.value.y;
  if (dy < -moveThreshold) {
    rotate(); // 위로 슥 올리면 회전
  }
};


// 줄 파괴 효과

// script setup 안에 getPopUpStyle 함수 추가
const getPopUpStyle = (r: number) => {
  // 지워진 줄의 중앙 좌표 계산 (gap 2px, 셀 크기 25px 고려)
  const top = r * 27 + 2 + 12.5; // 줄의 중앙
  const left = (BOARD_WIDTH * 27 + 2) / 2; // 보드의 가로 중앙
  return {
    top: `${top}px`,
    left: `${left}px`
  };
};

// 1. 점수 Pop-up 상태를 위한 새로운 인터페이스 및 상태 추가
interface ScorePopUp {
  id: number;
  r: number; // 지워진 줄의 인덱스 (위치 계산용)
  text: string;
}
const scorePopUps = ref<ScorePopUp[]>([]);
let popUpIdCounter = 0; // 고유 ID 생성을 위한 카운터

// clearLines 함수 수정 (두 가지 효과 폭팔과 점수 올라가기 로직 추가)
/*
const clearLines = async () => {
  let cleared = 0;
  const linesToClear: number[] = [];

  // 1. 꽉 찬 줄 찾기
  for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
    // 이미 파괴 중인 셀은 제외하고 체크
    if (board.value[r].every(cell => cell !== 0 && !cell.toString().includes('destroy'))) {
      linesToClear.push(r);
    }
  }

  if (linesToClear.length === 0) return; // 지울 줄 없으면 종료

  // 2. [효과 1] 파괴 애니메이션 적용 (더 화려하게!)
  linesToClear.forEach(r => {
    board.value[r] = board.value[r].map(cell => {
      // 기존 블록 숫자 뒤에 '-destroy' 문자열을 붙여서 클래스를 만듭니다.
      return `${cell}-destroy`; 
    });
  });

  // 3. [효과 2] 점수 Pop-up 생성
  linesToClear.forEach(r => {
    scorePopUps.value.push({
      id: popUpIdCounter++,
      r: r,
      text: `+${(linesToClear.length === 1 ? 100 : linesToClear.length === 2 ? 300 : linesToClear.length === 3 ? 500 : 800)}` // 연속 줄 보너스
    });
  });

  // 4. [지연] 애니메이션이 나올 시간을 줍니다. (0.4초)
  await new Promise(resolve => setTimeout(resolve, 400)); 

  // 5. [실제 삭제] 애니메이션 후 데이터에서 삭제
  board.value = board.value.filter((_, index) => !linesToClear.includes(index));

  // 6. 새 빈 줄 추가 및 점수 계산
  while (board.value.length < BOARD_HEIGHT) {
    board.value.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  cleared = linesToClear.length;
  // 실제 점수 갱신은 삭제 직후에 합니다.
  if (cleared > 0) {
    const lineScores = [0, 100, 300, 500, 800];
    score.value += lineScores[cleared];
  }

  // 7. [정리] 애니메이션 후 Pop-up 데이터를 삭제 (메모리 관리)
  // 빌더에서 TList 같은 컬렉션을 비우는 것과 같습니다.
  scorePopUps.value = [];
};
*/
const clearLines = async () => {
  const linesToClear: number[] = [];

  // 1. 꽉 찬 줄 인덱스 찾기
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    if (board.value[r]!.every(cell => cell !== 0)) {
      linesToClear.push(r);
    }
  }
  if (linesToClear.length === 0) return;

  // 2. [핵심] 해당 줄에 'destroy' 상태 부여
  // 여기서 board.value의 참조를 새로 만들어야 Vue가 반응합니다.
  const newBoard = board.value.map((row, rIdx) => {
    if (linesToClear.includes(rIdx)) {
      // 기존 숫자 뒤에 '-destroy'를 붙여 문자열로 변환
      return row.map(cell => `${cell}-destroy`);
    }
    return [...row];
  });
  board.value = newBoard; // 화면에 'destroy' 클래스가 적용됨

  playCombineSound();

  // 3. 점수 팝업 생성
  linesToClear.forEach(r => {
    scorePopUps.value.push({
      id: popUpIdCounter++,
      r: r,
      text: `+${linesToClear.length * 100}`
    });
  });

  // 4. [중요] 애니메이션이 실행될 시간을 정확히 기다림
  // 빌더의 Delay 함수처럼 작동합니다.
  await new Promise(resolve => setTimeout(resolve, 400));

  // 5. 애니메이션 종료 후 실제 데이터 삭제 및 보드 갱신
  const filteredBoard = board.value.filter((_, index) => !linesToClear.includes(index));
  while (filteredBoard.length < BOARD_HEIGHT) {
    filteredBoard.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  // 최종적으로 깨끗한 숫자로만 구성된 보드로 교체
  board.value = filteredBoard.map(row => row.map(cell => {
    return typeof cell === 'string' ? 0 : cell; // destroy 문자열 제거
  }));

  // 점수 반영 및 팝업 제거
  score.value += linesToClear.length * 100;
  setTimeout(() => { scorePopUps.value = []; }, 200);
};

/*
// clearLines 함수 수정 (파괴 효과 로직 추가)
const clearLines = async () => { // async/await 사용
  let cleared = 0;
  const linesToClear: number[] = [];

  // 1. 꽉 찬 줄 찾기
  for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
    if (board.value[r].every(cell => cell !== 0 && !cell.toString().includes('destroy'))) {
      linesToClear.push(r);
    }
  }

  if (linesToClear.length === 0) return; // 지울 줄 없으면 종료

  // 2. [효과] 파괴 애니메이션 적용
  linesToClear.forEach(r => {
    board.value[r] = board.value[r].map(cell => {
      // 기존 블록 숫자 뒤에 '-destroy' 문자열을 붙여서 클래스를 만듭니다.
      return `${cell}-destroy`; 
    });
  });

  // 3. [지연] 애니메이션이 나올 시간을 줍니다. (0.3초)
  await new Promise(resolve => setTimeout(resolve, 300)); 

  // 4. [실제 삭제] 애니메이션 후 데이터에서 삭제
  board.value = board.value.filter((_, index) => !linesToClear.includes(index));

  // 5. 새 빈 줄 추가 및 점수 계산
  while (board.value.length < BOARD_HEIGHT) {
    board.value.unshift(Array(BOARD_WIDTH).fill(0));
  }
  
  cleared = linesToClear.length;
  if (cleared > 0) score.value += cleared * 100;
};
*/
/*
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  initGame();
});
*/
// 2. Lifecycle에서 관리 (빌더의 FormCreate / FormDestroy와 같습니다)
onMounted(() => {
  // 혹시 남아있을지 모를 리스너를 제거하고 새로 등록 (중복 방지 핵심!)
  window.removeEventListener('keydown', handleKeyDown); 
  window.addEventListener('keydown', handleKeyDown);
  initGame();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (gameInterval) clearInterval(gameInterval);
});
</script>

<style scoped>
/* 테트리스 전용 CSS 스타일 */

.tetris-wrapper { font-family: 'Clear Sans', Arial, sans-serif; display: flex; flex-direction: column; 
    align-items: center; padding-top: 5px; color: #333; min-height: 100vh; }
.tetris-header { width: 300px; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 15px; font-weight: bold; color: #4e6d8b; }
.tetris-intro { padding: 0px 10px; }
.score-container { display: flex; gap: 5px; }
.score-box { background: #34495e; color: white; padding: 1px 5px; 
    border-radius: 3px; text-align: center; font-weight: bold; font-size: 14px; }
.score-box div { font-size: 20px; }

.board-container { 
  width: 274px; height: 544px; /* (25*10 + 2*11) x (25*20 + 2*21) */
  background: #2c3e50; border: 2px solid #34495e; border-radius: 6px; padding: 2px; 
  display: grid; grid-template-rows: repeat(20, 1fr); gap: 2px; position: relative;
  overflow: hidden; /* 블록 스폰 시 보드 밖 안 보이게 */
}
.board-row, .piece-row { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; }
.cell { 
  width: 25px; height: 25px; background: rgba(236, 240, 241, 0.05); border-radius: 2px; 
}
.cell.occupied { border: 1px solid rgba(0,0,0,0.2); box-shadow: inset 0 0 5px rgba(255,255,255,0.1); }
.board-container { 
  display: grid; grid-template-rows: repeat(20, 1fr); gap: 1px; 
  background: #333; padding: 5px; border: 4px solid #222; border-radius: 4px;
}
.board-row { display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px; }
.cell { width: 25px; height: 25px; background: #444; border-radius: 2px; }
/* 1. 기본 셀 스타일 (배경을 투명하게 두어 아래 tile 색상이 보이게 함) */
.cell { 
  width: 25px; 
  height: 25px; 
  background: rgba(68, 68, 68, 0.8); /* 기본 배경색 (어두운 회색) */
  border-radius: 2px;
  position: relative;
  box-sizing: border-box; /* 테두리 포함 크기 계산 */
}

/* 2. 블록별 색상 (클래스 명 앞에 .cell을 붙여 우선순위를 높입니다) */
.cell.tile-1 { background: #00f0f0; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* I */
.cell.tile-2 { background: #0000f0; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* J */
.cell.tile-3 { background: #f0a000; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* L */
.cell.tile-4 { background: #f0f000; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* O */
.cell.tile-5 { background: #00f000; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* S */
.cell.tile-6 { background: #a000f0; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* T */
.cell.tile-7 { background: #f00000; box-shadow: inset 0 0 8px #fff; border: 1px solid rgba(255,255,255,0.3); } /* Z */

/* 3. 파괴 효과 (애니메이션 중에도 색상이 유지되도록 보강) */
.cell.tile-destroy {
  animation: fireworkDestroy 0.4s ease-out forwards !important;
  z-index: 10;
  border: none !important;
}

/* 숫자별 블록 색상 매핑 */
.tile-1 { background: #00f0f0; box-shadow: inset 0 0 8px #fff; } /* I */
.tile-2 { background: #0000f0; box-shadow: inset 0 0 8px #fff; } /* J */
.tile-3 { background: #f0a000; box-shadow: inset 0 0 8px #fff; } /* L */
.tile-4 { background: #f0f000; box-shadow: inset 0 0 8px #fff; } /* O */
.tile-5 { background: #00f000; box-shadow: inset 0 0 8px #fff; } /* S */
.tile-6 { background: #a000f0; box-shadow: inset 0 0 8px #fff; } /* T */
.tile-7 { background: #f00000; box-shadow: inset 0 0 8px #fff; } /* Z */

.game-message { position: absolute; background: rgba(0,0,0,0.8); color: white; padding: 20px; text-align: center; }

/* 💡 파괴 효과 애니메이션 (핵심) */
/* 💡 화려한 불꽃놀이 파괴 효과 애니메이션 (핵심) */
.tile-destroy {
  animation: fireworkDestroy 0.4s ease-out forwards;
  /* 애니메이션 중에는 빛이 사방으로 확산되게 */
  box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.7);
  /* 여러 조각으로 쪼개지는 느낌을 주기 위해 */
  filter: contrast(1.2) brightness(1.1);
}
/*
.tile-destroy {
  animation: blockDestroy 0.3s ease-out forwards;
  /* 애니메이션 중에는 테두리가 살짝 빛나게 * /
  box-shadow: 0 0 15px #fff;
}
*/

@keyframes fireworkDestroy {
  0% { 
    transform: scale(1) rotate(0); 
    opacity: 1; 
  }
  20% { 
    /* 색상 반전 및 확산 */
    transform: scale(1.1) rotate(10deg);
    filter: invert(1) contrast(1.5) brightness(1.2); /* 색상 반전 (네온 효과) */
    opacity: 0.9;
  }
  50% { 
    /* 사방으로 조각들이 흩어지는 느낌 */
    transform: scale(0.6) rotate(-20deg) translate(-5px, -10px); /* 왼쪽 위로 이동 */
    opacity: 0.7;
  }
  80% { 
    /* 빛의 잔상 */
    transform: scale(0.3) rotate(45deg) translate(5px, 10px); /* 오른쪽 아래로 이동 */
    opacity: 0.4;
    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.5);
  }
  100% { 
    /* 최종 사라짐 */
    transform: scale(0) rotate(180deg); 
    opacity: 0;
  }
}

/* 💡 점수 Pop-up 애니메이션 (핵심) */
.score-popup {
  position: absolute;
  transform: translate(-50%, -50%); /* 텍스트 중앙 정렬 */
  font-size: 18px;
  font-weight: bold;
  color: #fff; /* 점수 색상 */
  text-shadow: 0 0 5px #ff9f43, 0 0 10px #ff9f43; /* 오렌지색 잔상 (점수 강조) */
  animation: scorePopUp 0.6s ease-out forwards;
  z-index: 101; /* 블록 위에 표시 */
}

@keyframes scorePopUp {
  0% { 
    transform: translate(-50%, -50%) scale(1) translateY(10px); /* 아래에서 시작 */
    opacity: 1; 
  }
  50% { 
    /* 톡 튀어 오름 및 크기 확대 */
    transform: translate(-50%, -50%) scale(1.2) translateY(-10px); /* 위로 이동 */
    opacity: 1;
    text-shadow: 0 0 10px #ff9f43, 0 0 15px #ff9f43, 0 0 20px #ff9f43; /* 빛 확산 */
  }
  100% { 
    /* 최종 사라짐 및 크기 축소 */
    transform: translate(-50%, -50%) scale(1) translateY(-15px); /* 더 위로 이동 */
    opacity: 0;
  }
}


@keyframes blockDestroy {
  0% { 
    transform: scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.1); /* 살짝 커지면서 빛남 */
    opacity: 0.8;
  }
  100% { 
    transform: scale(0.5) rotate(45deg); /* 작아지고 회전하며 사라짐 */
    opacity: 0;
  }
}
/* 기존 .cell 스타일 아래에 추가하거나 교체 */
.cell { 
  width: 25px; height: 25px; 
  background: #444; /* 기본 배경 */
  border-radius: 2px;
  position: relative; /* 팝업 위치 기준 */
}

/* 💡 파괴 효과 애니메이션 (우선순위 강화) */
.cell.tile-destroy {
  animation: fireworkDestroy 0.4s ease-out forwards !important;
  z-index: 10;
  border: none !important;
}

/* 💡 점수 Pop-up (부모가 .board-row이므로 위치 조정) */
.score-popup {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px #ff9f43, 0 0 20px #ff9f43;
  animation: scorePopUp 0.6s ease-out forwards;
  z-index: 100;
  pointer-events: none; /* 클릭 방해 금지 */
}
.next-container {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #34495e;
  padding: 5px;
  border-radius: 6px;
  border: 2px solid #2c3e50;
}

.next-label {
  color: #ecf0f1;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
}
/*
.next-preview {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.next-row {
  display: flex;
  gap: 1px;
}

/* 다음 블록용 작은 셀 * /
.small-cell {
  width: 15px;
  height: 15px;
}*/
.next-preview {
  /* 셀 크기 15px + 간격 1px 기준, 4x4 블록이 들어갈 넉넉한 공간 */
  width: 65px; 
  height: 65px;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 수직 중앙 정렬 */
  align-items: center;     /* 수평 중앙 정렬 */
  background: rgba(0, 0, 0, 0.2); /* 살짝 어두운 배경을 주면 틀이 고정된 게 잘 보여요 */
  border-radius: 4px;
}

.next-row {
  display: flex;
  gap: 1px;
}

.small-cell {
  width: 15px;
  height: 15px;
  /* 빈 셀도 공간을 차지하도록 기본 배경색 유지 */
  background: rgba(255, 255, 255, 0.05); 
  border-radius: 1px;
}
</style>