<template>
<!-- <div class="game-container">
  <div class="game-text score-board">SCORE: {{ score }}</div>
  <canvas ref="canvasRef" width="400" height="400"></canvas>
  <div v-if="!isPlaying" class="game-text">방향키를 눌러 시작하세요!</div>
</div> -->
  <div class="game-container">
    <div class="score-board">
      동방 DragonByte : {{ String(score).padStart(4, '0') }}
    </div>

    <canvas ref="canvasRef" width="400" height="400"></canvas>

    <div class="game-info">
      <p v-if="!isPlaying" class="blink">PRESS ANY ARROW KEY TO START</p>
      <p v-else>USE ARROW KEYS TO NAVIGATE</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;

// 1: '🍎', 2: '🍇', 3: '🍊', 4: '🍌', 5: '🍓', 99: '💣'

const stages = [
  { level: 1, speed: 12, walls: [] }, // 평화로운 시작
  { level: 2, speed: 11, walls: [{x: 5, y: 5}, {x: 14, y: 14}] },
  { level: 3, speed: 10, walls: [{x: 10, y: 5}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 4, speed: 9, walls: [{x: 10, y: 5}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 5, speed: 8, walls: [{x: 10, y: 6}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 6, speed: 7, walls: [{x: 10, y: 7}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 7, speed: 6, walls: [{x: 10, y: 8}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 8, speed: 5, walls: [{x: 10, y: 9}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 9, speed: 4, walls: [{x: 10, y: 10}, {x: 10, y: 6}, {x: 10, y: 7}] },
  { level: 10, speed: 3, walls: [{x: 10, y: 11}, {x: 10, y: 6}, {x: 10, y: 7}] } /* 맵을 가득 채운 복잡한 미로 */
];
// 2스테이지: 상하단에 긴 벽 (복도 느낌)
const stage2Walls = [
  {x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5},
  {x: 5, y: 14}, {x: 6, y: 14}, {x: 7, y: 14}
];
// 3스테이지: 중앙에 십자(+) 모양 장애물
const stage3Walls = [
  {x: 10, y: 8}, {x: 10, y: 9}, {x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12},
  {x: 8, y: 10}, {x: 9, y: 10}, {x: 11, y: 10}, {x: 12, y: 10}
];
stages[1]!.walls = stage2Walls;
stages[3]!.walls = stage3Walls;


const currentLevel = ref(1);
let walls: {x: number, y: number}[] = [];

// 게임 설정
const gridSize = 20; // 한 칸의 크기 (px)
const tileCount = 20; // 가로세로 칸 수
const initialSpeed = 9; // 숫자가 낮을수록 빠름 (프레임 스킵 기준)

// 상태 변수
interface TSnake {
  x: number;
  y: number;
};

let snakeStart: TSnake = { x: 9, y: 18 };
let snake: TSnake[] = [snakeStart]; // [snakeStart, snakeStart, snakeStart]; // 뱀 몸통 좌표 배열
let food = { x: 5, y: 5, isGolden: false };
let dx = 0; // 수평 방향 속도 (1, -1, 0)
let dy = 0; // 수직 방향 속도 (1, -1, 0)
let score = ref(0);
let isPlaying = ref(false);
let frameCounter = 0;
let applesEaten = 0; // 황금 사과 출현 계산용

// 스테이지 설정 함수
const setupLevel = (lv: number) => {
  const stage = stages[lv - 1];
  walls = stage!.walls;
  // 초기 위치가 벽과 겹치지 않게 방어
  snake = [{ x: 2, y: 2 }];
  dx = 0; dy = 0;
  createFood();
};

// 사운드 객체 생성 (컴포넌트 상단에 한 번만 선언)
// public/sounds/pop.mp3 경로에 파일이 있다고 가정합니다.
const combineSound = new Audio(`${import.meta.env.BASE_URL}sounds/tik.mp3`);
const getSound = new Audio(`${import.meta.env.BASE_URL}sounds/pop.mp3`);

// 사운드 재생 함수
const playGetSound = () => {
  // 재생 중일 때 다시 호출되면 처음부터 다시 재생 (연속 합치기 대응)
  combineSound.currentTime = 0; 
  combineSound.volume = 0.2;
  combineSound.play().catch(e => {
    // 브라우저 정책상 첫 상호작용 전에는 재생이 차단될 수 있음
    console.log("사운드 재생 차단됨1:", e);
  });
};

const playCombineSound = () => {
  // 재생 중일 때 다시 호출되면 처음부터 다시 재생 (연속 합치기 대응)
  getSound.currentTime = 0; 
  getSound.volume = 0.2;
  getSound.play().catch(e => {
    // 브라우저 정책상 첫 상호작용 전에는 재생이 차단될 수 있음
    console.log("사운드 재생 차단됨2:", e);
  });
};


// 음식 생성 (뱀 몸통 피해서)
/*
const createFood = () => {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
};
*/
const createFood = () => {
  let newFood;
  let isInvalid = true;

  while (isInvalid) {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      isGolden: applesEaten > 0 && applesEaten % 5 === 0 // 5개마다 황금사과
    };
    
    // 음식 생성 시 뱀의 몸통이나 '벽'에 겹치지 않는지 확인 (빌더의 중복 체크 로직)
    const onSnake = snake.some(s => s.x === newFood!.x && s.y === newFood!.y);
    const onWall = walls.some(w => w.x === newFood!.x && w.y === newFood!.y);
    if (!onSnake && !onWall) isInvalid = false;
  }
  food = newFood!;
};

const init = () => {
   // 상태 초기화
  //snake = [{ x: 10, y: 10 }];
  snake = [snakeStart, snakeStart, snakeStart];
  dx = 0; 
  dy = 0;
  score.value = 0;
  isPlaying.value = false; // 여기서 false가 되면 draw 함수 상단 조건에 걸림
  createFood(); // 음식 위치도 초기화
}


// 초당 60회 그려짐

const draw = () => {
  if (!ctx || !canvasRef.value) return;
 
  // 2. 게임 중이 아닐 때 처리
  if (!isPlaying.value) {
    ctx.fillStyle = "#00ff00"; 
    ctx.font = "20px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(`STAGE ${currentLevel.value}`, 200, 180);
    //ctx.fillText("SNAKE BYTE", canvasRef.value.width / 2, canvasRef.value.height / 2 - 20);
    ctx.font = "14px 'Courier New'";
    ctx.fillText("Space Key or Touch TO START", canvasRef.value.width / 2, canvasRef.value.height / 2 + 20);
    
    // 뱀의 현재 위치(초기 위치)는 보여줍니다.
    snake.forEach((segment) => {
      ctx!.fillStyle = "#00aa00";
      ctx!.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    requestAnimationFrame(draw);
    return;
  }

  // 뱀의 속도 조절 (매 프레임마다 이동하지 않고 일정 프레임마다 이동)
  const stageSpeed = stages[currentLevel.value - 1]!.speed;
  if (++frameCounter < stageSpeed) {
    requestAnimationFrame(draw);
    return;
  }
  frameCounter = 0;

  // 1. 배경 지우기
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);


  // 2. 뱀 이동 로직
  if (dx !== 0 || dy !== 0) {
    const head = { x: snake[0]!.x + dx, y: snake[0]!.y + dy };

    // 벽 충돌 체크
    const hitWall = walls.some(w => w.x === head.x && w.y === head.y);
    //if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || 
        snake.some(s => s.x === head.x && s.y === head.y) || hitWall) {    
      gameOver();
      return;
    }

    // 자기 몸 충돌 체크
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head); // 새로운 머리 추가

    // 음식 획득 체크
    if (head.x === food.x && head.y === food.y) {
      score.value += food.isGolden ? 50 : 10;
      applesEaten++;

      if (food.isGolden)
        playCombineSound();
      else
        playGetSound();

      // [핵심] 진동 추가! 
      // 50ms 동안 짧게 징~ 하고 울립니다.
      if ("vibrate" in navigator) {
          navigator.vibrate(1); 
      }

      // 10개 먹을 때마다 다음 스테이지로!
      if (applesEaten % 10 === 0 && currentLevel.value < 10) {
        currentLevel.value++;

        // [보너스] 스테이지 클리어 시에는 좀 더 길게 두 번! (징~징~)
        if ("vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]); 
        }

        setupLevel(currentLevel.value);
        isPlaying.value = false; // 잠시 대기
      } else {
        snake.unshift(head); // 새로운 머리 하나 더 추가
        createFood();
        if (food.isGolden) snake.pop(); // 황금사과는 몸이 안 늘어남
      }
    } else {
      snake.pop();
    }

    //   createFood();
    // } else {
    //   snake.pop(); // 음식을 못 먹었으면 꼬리 제거
    // }
  }

  /*
  // 3. 음식 그리기 (빨간 사과)
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

  // 4. 뱀 그리기 (초록색 몸통)
  snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#00ff00" : "#00aa00"; // 머리는 더 밝게
    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
  });
  */
 // [그리기] 장애물 벽 (회색)
  ctx.fillStyle = "#555555";
  walls.forEach(w => ctx!.fillRect(w.x * gridSize, w.y * gridSize, gridSize - 2, gridSize - 2));

  // [그리기] 음식 (일반:빨강, 황금:노랑)
  ctx.fillStyle = food.isGolden ? "#ffd700" : "#ff0000";
  if (food.isGolden) {
    ctx.shadowBlur = 15; // 황금 사과 광채 효과
    ctx.shadowColor = "#ffd700";
  }
  //ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
  ctx.font = "19px 'Courier New'";
  ctx.fillText(food.isGolden ? '🍊' : '🍎', food.x * gridSize + gridSize/2, food.y * gridSize + gridSize - gridSize /4);
  ctx.shadowBlur = 0; // 초기화

  // [그리기] 뱀
  snake.forEach((s, i) => {
    ctx!.fillStyle = i === 0 ? "#00ff00" : "#00aa00";
    if (i === 0) {
      //ctx.fillText('😎', s.x * gridSize + gridSize/2, s.y * gridSize + gridSize - gridSize /4); // food.x * gridSize + gridSize/2, food.y * gridSize + gridSize - gridSize /4);
    } 
    ctx!.fillRect(s.x * gridSize, s.y * gridSize, gridSize - 2, gridSize - 2);
  });

  requestAnimationFrame(draw);
};


const gameOver = () => {
  // 200ms 동안 묵직하게 진동
//   if ("vibrate" in navigator) {
//     navigator.vibrate(200); 
//   }
  //alert(`GAME OVER! SCORE: ${score.value}`);
  
  init();
  requestAnimationFrame(draw);
};
/*
const gameOver = () => {
  alert(`GAME OVER! SCORE: ${score.value}`);
  snake = [{ x: 10, y: 10 }];
  dx = 0; dy = 0;
  score.value = 0;
  isPlaying.value = false;
};
*/

// 키보드 방향키 제어
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isPlaying.value) {
    if (e.key == ' ') {
        init();
        isPlaying.value = true;
    }
    return;
  }
  
  switch (e.key) {
    case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
    case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
    case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
    case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
  }
};

// 터치 좌표 저장용
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0]!.clientX;
  touchStartY = e.touches[0]!.clientY;
};

const handleTouchMove = (e: TouchEvent) => {
  // 게임 중일 때 화면 스크롤 방지 (중요!)
  if (isPlaying.value && e.cancelable) {
    e.preventDefault();
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (!isPlaying.value) {
    init();
    // 뱀이 가만히 있으면 심심하니까 처음엔 오른쪽(dx=1)으로 출발시킬게요.
    if (dx === 0 && dy === 0) {
      dx = 0; 
      dy = -1;
    }
    isPlaying.value = true;
    return;
  }

  const touchEndX = e.changedTouches[0]!.clientX;
  const touchEndY = e.changedTouches[0]!.clientY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // 최소 스와이프 거리 (너무 살짝 건드린 건 무시)
  const minSwipeDistance = 30;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    // 가로 방향 스와이프가 더 큼
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0 && dx !== -1) { // 오른쪽
        dx = 1; dy = 0;
      } else if (diffX < 0 && dx !== 1) { // 왼쪽
        dx = -1; dy = 0;
      }
    }
  } else {
    // 세로 방향 스와이프가 더 큼
    if (Math.abs(diffY) > minSwipeDistance) {
      if (diffY > 0 && dy !== -1) { // 아래쪽
        dx = 0; dy = 1;
      } else if (diffY < 0 && dy !== 1) { // 위쪽
        dx = 0; dy = -1;
      }
    }
  }
};

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') || null;
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('touchstart', handleTouchStart, { passive: false });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', handleTouchEnd);
  draw();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchend', handleTouchEnd);
});
</script>


<style scoped>

/* 캔버스: CRT 모니터 화면 */
canvas {
  background-color: #050505;
  border: 4px solid #222;
  box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.1); /* 화면 안쪽의 미세한 녹색 광채 */
  image-rendering: pixelated; /* 도트가 뭉개지지 않고 선명하게 보이도록 (중요!) */
  display: block;

  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none; /* 브라우저의 기본 제스처 간섭 차단 */
}

/* 전체 컨테이너: 어두운 방 안의 모니터 느낌 */
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  padding: 20px;
  border-radius: 20px;
  border: 8px solid #333; /* 모니터 베젤 느낌 */
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  max-width: fit-content;
  margin: 40px auto;
}

/* 스코어보드: 8비트 폰트 느낌 */
.score-board {
  font-family: 'Courier New', Courier, monospace;
  font-size: 18px;
  color: #00ff00; /* 클래식 그린 */
  text-shadow: 0 0 10px #00ff00;
  margin-bottom: 15px;
  letter-spacing: 2px;
}

/* 하단 안내 메시지 */
.game-info {
  margin-top: 15px;
  font-family: 'Courier New', monospace;
  color: #888;
  font-size: 14px;
  text-align: center;
}

/* 반짝이는 "PRESS KEY" 효과 */
.blink {
  animation: blink-animation 1s steps(5, start) infinite;
  color: #ff00ff; /* 마젠타 포인트 */
}

@keyframes blink-animation {
  to { visibility: hidden; }
}

/* [추가] 모바일 대응: 화면 크기에 맞춰 조절 */
@media (max-width: 500px) {
  .game-container {
    padding: 10px;
    border-width: 4px;
  }
  canvas {
    width: 320px;
    height: 320px;
  }
}
</style>