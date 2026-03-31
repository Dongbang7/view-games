<template>
<!-- <div class="game-container">
  <canvas ref="canvasRef" width="480" height="320"></canvas>
  <div class="controls">
    <p>마우스를 움직여 패들을 조종하세요!</p>
  </div>
</div> -->
<div class="game-container">
    <div class="canvas-wrapper" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        <canvas 
        ref="canvasRef" 
        :width="canvasWidth" 
        :height="canvasHeight"
        ></canvas>    
    <div v-if="!isPlaying" class="overlay">
      <h2 class="game-text title">GAME OVER</h2>
      <p class="game-text score">FINAL SCORE: {{ score }}</p>
      <button class="restart-btn" @click.stop="resetGame">ReTry</button>
    </div>
  </div>

  <div class="controls-panel">
    <div class="game-text score-board">DongBang >> SCORE: {{ String(score).padStart(4, '0') }}</div>
  </div>
</div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number;

// 게임 설정
const ballRadius = 8;
const paddleHeight = 12;
const paddleWidth = 75;
const brickRowCount = 4;
const brickColumnCount = 5;
const brickWidth = 60;
const currentBrickWidth = ref(75);
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 20;
let score = ref(0); // 점수 상태 변수

// 상태 변수
let x = 0, y = 0; // 공 위치
let dx = 2, dy = -2; // 공 속도(단위 벡터 역할)
// [추가] 난이도 상승을 위한 속도 시스템
const INITIAL_SPEED = 1; // 초기 속도 (픽셀/프레임 @ 60Hz 기준)
const SPEED_INCREMENT = 0.05; // 벽돌 하나 깰 때마다 증가할 속도
let currentSpeed = INITIAL_SPEED; // 현재 공의 속도력

let paddleX = 0;
interface IBlock {
  x: number; 
  y: number; 
  status: number;
};
//let bricks: { x: number; y: number; status: number }[][] = [];
let bricks: IBlock[][] = [];
const isPlaying = ref(true); // 게임 실행 상태 제어


/*
const initBricks = () => {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c]![r] = { x: 0, y: 0, status: 1 };
    }
  }
};
*/
// 위처럼 해도 되고
// 아래처럼 TS 컴파일러가 오인하지 않게 늘여써주는 방식도 된다.

const initBricks = () => {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    // 1. 먼저 열(column) 배열을 하나 만듭니다.
    //const column: { x: number; y: number; status: number }[] = [];
    const column: IBlock[] = [];
    
    for (let r = 0; r < brickRowCount; r++) {
      // 2. 행(row) 데이터를 push 합니다.
      //column.push({ x: 0, y: 0, status: 1 });
      let block: IBlock = { x: 0, y: 0, status: 1 };
      column.push(block);
    }
    
    // 3. 완성된 열을 전체 배열에 넣습니다.
    bricks[c] = column;
  }
};

let lastTime: number | null = null; // 처음엔 null로 설정

const draw = (currentTime: number) => {
  //if (!ctx || !canvasRef.value) return;
  if (!ctx || !canvasRef.value || !isPlaying.value) {
    lastTime = null; // 게임 멈추면 시간 초기화
    return; // [수정] 정지 상태면 그리지 않음
  }
  // 첫 프레임이면 현재 시간을 기록만 하고 넘어감
  if (lastTime == null || lastTime === 0) {  // lastTime === null 이면 에러가 남.
    lastTime = currentTime;
    animationId = requestAnimationFrame(draw);
    return;
  }
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  // 2. 속도에 deltaTime을 곱해서 보정 (기준값 16.6ms)
  // 프레임이 밀려도 공은 원래 가야 할 위치만큼 점프합니다.
  // 혹시 모를 비정상적인 튐 방지 (예: 브라우저 렉)
  // 프레임 간격이 100ms(0.1초)를 넘으면 16.6ms로 강제 고정
  const safeDeltaTime = deltaTime > 100 ? 16.6 : deltaTime;
  const timeCorrection = safeDeltaTime / 16.6;

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  // 1. 벽돌 그리기 & 충돌 검사
  let bricksLeft = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c]![r];
      if (b!.status === 1) {
        bricksLeft++;
        //const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        //const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        // [수정] 고정 brickWidth 대신 currentBrickWidth.value 사용
        const brickX = c * (currentBrickWidth.value + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        b!.x = brickX;
        b!.y = brickY;
        
        // 벽돌 그리기
        ctx.beginPath();
        //ctx.rect(brickX, brickY, brickWidth, brickHeight);
        // ... 그리기 로직 (rect의 너비도 currentBrickWidth.value로!) ...
        ctx.rect(brickX, brickY, currentBrickWidth.value, brickHeight);
        ctx.fillStyle = "#0095DD";// 네온 블루
        ctx.fill();
        ctx.closePath();

        // [핵심] 공과 벽돌 충돌 로직
        if (x > brickX && x < brickX + currentBrickWidth.value && y > brickY && y < brickY + brickHeight) {    
          dy = -dy;
          b!.status = 0; // 벽돌 파괴!
          score.value += 10; // 벽돌 깰 때마다 10점 추가!
          playCombineSound();
          // [핵심] 난이도 상승: 벽돌 깰 때마다 속도 증가
          currentSpeed += SPEED_INCREMENT;
        }
      }
    }
  }
  // 승리 조건 체크 (벽돌 다 깼는지)
//   if(score.value === brickRowCount * brickColumnCount * 10) {
//     alert("Congratulations! You Win!");
//     document.location.reload();
//   }
  // 승리 조건 체크
  if (bricksLeft === 0) {
      alert("Congratulations! You Win!");
      isPlaying.value = false;
      return;
  }
  // 2. 공 그리기
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#FF5722";// 주황색 네온
  ctx.fill();
  ctx.closePath();

  // 3. 패들 그리기
  ctx.beginPath();
  ctx.rect(paddleX, canvasRef.value.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#9966DD";
  ctx.fill();
  ctx.closePath();

  // 4. 벽 및 패들 충돌 로직
  if (x + dx > canvasRef.value.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) {
    dy = -dy; // 천장
  } else if (y + dy > canvasRef.value.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
        // 이 부분이 실행 안된다.
      dy = -dy; // 패들에 튕김
      playCombineSound(); 
    } else {
      isPlaying.value = false; 
      alert("GAME OVER");
      document.location.reload();
    }
  }

  //score = timeCorrection; //이걸 쓰면 화면 밖으로 나가버린다. 즉 점수를 올려야 하는데, 그기서 뻑이 난다.
  //console.log(timeCorrection);
  //x += dx;  y += dy;
  //x += dx * currentSpeed * 1;  y += dy * currentSpeed * 1;
  // [핵심] 6. 이동 거리 계산 (현재 속도 + 시간 보정)
  x += dx * currentSpeed * timeCorrection; 
  y += dy * currentSpeed * timeCorrection;
  
  // [수정] 게임 오버 로직
  if (y + dy > canvasRef.value.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      // 이제 alert 대신 상태를 바꿉니다
      isPlaying.value = false; 
      cancelAnimationFrame(animationId);
      return; // 루프 종료
    }
  }

  animationId = requestAnimationFrame(draw);
};

const canvasWidth = ref(400); // 기본값
const canvasHeight = ref(400);

// [추가] 화면 크기에 맞춰 캔버스 크기 재설정
const resizeCanvas = () => {
  // 화면 너비가 480보다 작으면 화면 너비의 90% 정도로 줄임 (여백 확보)
  const padding = 40; 
  const availableWidth = window.innerWidth - padding;
  
  if (availableWidth < 480) {
    canvasWidth.value = availableWidth;
    // 가로가 줄어든 비율만큼 높이도 살짝 줄여주면 비율이 유지됩니다.
    canvasHeight.value = (availableWidth * 400) / 480;
  } else {
    canvasWidth.value = 480;
    canvasHeight.value = 400;
  }
  
  // [핵심] 캔버스 너비에 맞춰 벽돌 너비 계산
  // 공식: (전체너비 - 양쪽 오프셋 - 벽돌 사이 간격 합계) / 벽돌 개수
  const totalPadding = brickPadding * (brickColumnCount - 1);
  const totalOffset = brickOffsetLeft * 2;
  currentBrickWidth.value = (canvasWidth.value - totalOffset - totalPadding) / brickColumnCount;
};

// 터치 이동 처리 함수
const touchMoveHandler = (e: TouchEvent) => {
  // 1. 게임 중이 아니면(오버레이가 떠 있으면) 브라우저 기본 동작을 허용합니다.
  if (!isPlaying.value) return;    

  if (!canvasRef.value) return;
  
  // 브라우저 기본 스크롤 동작 방지 (게임 중 화면이 위아래로 출렁이는 것 방지)
  // 2. 게임 중일 때만 스크롤/새로고침 방지
  if (e.cancelable) {
    e.preventDefault();
  }
  
  const touch = e.touches[0]; // 첫 번째 손가락 정보
  const rect = canvasRef.value.getBoundingClientRect();
  
  // 캔버스 내에서의 상대적 X 좌표 계산
  const relativeX = touch!.clientX - rect.left;
  
  if (relativeX > 0 && relativeX < canvasRef.value.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
};

// 마우스 이동 처리 (패들 조작)
const mouseMoveHandler = (e: MouseEvent) => {
  if (!canvasRef.value) return;
  const relativeX = e.clientX - canvasRef.value.offsetLeft;
  if (relativeX > 0 && relativeX < canvasRef.value.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
};


// [추가] 게임 초기화 함수 (새로고침 없이 값만 리셋)
const resetGame = () => {
  // 1. 기존 루프가 있다면 확실히 제거 (중복 방지)
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (!canvasRef.value) return;
  
  // [핵심] 공의 시작 X좌표 랜덤 결정
  // 너무 벽에 붙지 않도록 좌우 30px 정도 여백을 둡니다.
  const minX = 30;
  const maxX = canvasRef.value.width - 30;

  // Math.random() * (max - min) + min 공식 사용
  x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

  // 공 위치 및 속도 초기화
  //x = canvasRef.value.width / 2; 이건 중아 시작.
  y = canvasRef.value.height - 30;
  dx = 2;
  dy = -2;
  
  // 패들 위치 초기화
  paddleX = (canvasRef.value.width - paddleWidth) / 2;
  currentSpeed = INITIAL_SPEED; // 현재 공의 속도력

  // 점수 및 벽돌 초기화
  score.value = 0;
  lastTime = 0;
  initBricks();
  
  // 상태 복구 및 루프 재시작
  isPlaying.value = true;
  draw(0); 
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


//------------------
onMounted(() => {
  resizeCanvas(); // 시작할 때 크기 조절
  window.addEventListener('resize', resizeCanvas); // 화면 돌리거나 크기 바뀔 때 대응

  ctx = canvasRef.value?.getContext('2d') || null;
  if (canvasRef.value) {
    x = canvasRef.value.width / 2;
    y = canvasRef.value.height - 30;
    paddleX = (canvasRef.value.width - paddleWidth) / 2;
  }
  initBricks();
  draw(0);
  window.addEventListener('mousemove', mouseMoveHandler);

  // [추가] 터치 이벤트 등록 (모바일용)
  // { passive: false }는 e.preventDefault()를 작동시키기 위해 필요합니다.
  window.addEventListener('touchstart', touchMoveHandler, { passive: false });
  window.addEventListener('touchmove', touchMoveHandler, { passive: false })
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('mousemove', mouseMoveHandler);
  // [추가] 이벤트 제거
  window.removeEventListener('touchstart', touchMoveHandler);
  window.removeEventListener('touchmove', touchMoveHandler);
});
</script>


<style scoped>
/* 전체 게임 컨테이너: 어두운 오락실 분위기 */
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #101010; /* 아주 어두운 회색 */
  padding: 10px;
  border-radius: 15px;
  width: fit-content;
  margin: 1px auto;
  
  /* [핵심] 네온 블루 보더 효과 */
  border: 4px solid #00d9ff;
  box-shadow: 0 0 15px #00d9ff, inset 0 0 10px #00d9ff;

  touch-action: none; /* 브라우저의 기본 터치 액션(줌, 스크롤)을 완전히 차단 */

  /* [핵심] 고정 너비 제거, 최대 너비만 설정 */
  max-width: 95vw;
}

/* Canvas 스타일: 게임 화면 */
/* [수정] 늘어난 벽돌을 감당하기 위해 Canvas 높이 증량 */
.canvas-wrapper {
  position: relative;
  /* width/height는 이제 :style에서 제어하므로 여기선 지워도 됩니다 */
  /* width: 370px;
  height: 400px; /* 기존 320px -> 400px */
}
canvas {
  background-color: #000000; /* 완전 검은색 배경 */
  border-radius: 5px;
  
  /* 마우스 커서를 숨겨서 몰입감 증대 */
  cursor: none; 

  /* [추가] Canvas 자체에도 은은한 광채 */
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  /* [추가] CSS로도 높이 맞춰줌 */
  width: 100%; /*370px; */
  /* height: auto; */
  /*height: 400px; */
  /* 모바일 화면에서 캔버스가 삐져나가지 않도록 설정 */
  max-width: 100%;  
  display: block; /* 하단 미세 공백 제거 */
}

/* 하단 컨트롤 및 점수 표시 */
.controls-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 90%;
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid #00d9ff;
}

/* 레트로 텍스트 스타일 */
.game-text {
  font-family: 'Courier New', Courier, monospace; /* monospace 계열 추천 */
  color: #00ff00; /* 형광 그린 */
  font-weight: bold;
  font-size: 18px;
  
  /* [핵심] 네온 텍스트 효과 */
  text-shadow: 0 0 5px #00ff00;
}

/* 스코어보드 (나중에 구현할 자리!) */
.score-board {
  font-size: 20px;
  width: 100%;
  color: #ff00ff; /* 형광 핑크 */
  text-shadow: 0 0 8px #ff00ff;
}

/* 하단 안내 메시지 */
.controls p {
  color: #ffffff;
  font-family: Arial, sans-serif;
  font-size: 14px;
  opacity: 0.8;
  margin-top: 5px;
}
/* 캔버스와 레이어를 겹치기 위한 래퍼 */
.canvas-wrapper {
  position: relative;
  width: 480px;
  height: 400px;
}

/* 캔버스 위에 반투명하게 덮이는 레이어 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* 반투명 검정 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
}

.title { color: #ff0000; font-size: 40px; margin-bottom: 10px; }
.score { color: #ffffff; margin-bottom: 20px; }

/* 리트라이 버튼: 네온 스타일 */
.restart-btn {
  background: transparent;
  color: #00d9ff;
  border: 2px solid #00d9ff;
  padding: 10px 25px;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 10px #00d9ff;
  transition: 0.2s;
}

.restart-btn:hover {
  background: #00d9ff;
  color: #000;
  box-shadow: 0 0 20px #00d9ff;
}
</style>