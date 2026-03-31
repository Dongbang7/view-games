// src/composables/useXPangSwipe.ts

import { ref } from 'vue';

export const useXPangSwipe = (
  // 기존 useXPang에서 필요한 함수들을 주입받습니다.
  handleBrickClick: (r: number, c: number) => Promise<void>
) => {
  // 터치 시작 지점 (화면 좌표 X, Y)
  const touchStartPos = ref<{ x: number; y: number } | null>(null);
  // 터치 시작된 벽돌 좌표 (보드 r, c)
  const startBrickAddr = ref<{ r: number; c: number } | null>(null);

  // 드래그 방향 정의 (상, 하, 좌, 우)
  type Direction = 'up' | 'down' | 'left' | 'right';

  // 스와이프 민감도 (픽셀 단위, 이 이상 밀어야 이동으로 간주)
  const SWIPE_THRESHOLD = 30; 

  // --- 이벤트 핸들러 (App.vue에서 호출) ---

  // 1. 터치 시작 (touchstart)
  const onTouchStart = (e: TouchEvent, r: number, c: number) => {
    // 멀티 터치 방지 (첫 번째 손가락만 처리)
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    touchStartPos.value = { x: touch!.clientX, y: touch!.clientY };
    startBrickAddr.value = { r, c };

    // 첫 번째 클릭(선택) 효과를 위해 기존 함수 호출 (시각적 피드백)
    handleBrickClick(r, c); 
  };

  // 2. 터치 이동 (touchmove) - 여기서 방향 계산 및 교체 실행
  const onTouchMove = (e: TouchEvent) => {
    // 터치 시작 정보가 없거나, 멀티 터치면 무시
    if (!touchStartPos.value || !startBrickAddr.value || e.touches.length > 1) return;

    const touch = e.touches[0];
    const dx = touch!.clientX - touchStartPos.value.x; // 가로 이동 거리
    const dy = touch!.clientY - touchStartPos.value.y; // 세로 이동 거리

    // 민감도 체크 (충분히 움직였는지 확인)
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

    // 화면 스크롤 방지 (중요!)
    e.preventDefault();

    // 방향 결정 (가로 vs 세로 중 더 많이 움직인 쪽)
    let direction: Direction;
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    // 대상 벽돌 좌표 계산
    const { r, c } = startBrickAddr.value;
    let targetR = r;
    let targetC = c;

    switch (direction) {
      case 'up': targetR = r - 1; break;
      case 'down': targetR = r + 1; break;
      case 'left': targetC = c - 1; break;
      case 'right': targetC = c + 1; break;
    }

    // 보드 범위를 벗어나는지 확인
    if (targetR < 0 || targetR >= 7 || targetC < 0 || targetC >= 7) return;

    // --- 핵심: 교체 실행 ---
    // 방향이 결정되면 즉시 대상을 클릭한 것처럼 처리하여 스와이프 완성!
    handleBrickClick(targetR, targetC);

    // 한 번 스와이프되면 터치 상태 초기화 (연속 스와이프 방지)
    resetTouchState();
  };

  // 3. 터치 종료 (touchend)
  const onTouchEnd = () => {
    resetTouchState();
  };

  const resetTouchState = () => {
    touchStartPos.value = null;
    startBrickAddr.value = null;
  };

  // 마우스 클릭 상태를 추적하는 변수 추가
  const isMouseDown = ref(false);

  // 1. 마우스 다운 (터치 시작과 동일한 로직)
  const onMouseDown = (e: MouseEvent, r: number, c: number) => {
    isMouseDown.value = true;
    touchStartPos.value = { x: e.clientX, y: e.clientY };
    startBrickAddr.value = { r, c };
    
    // 첫 번째 클릭(선택) 효과
    handleBrickClick(r, c);
  };

  // 2. 마우스 이동 (드래그 중 방향 계산)
  const onMouseMove = (e: MouseEvent) => {
    if (!isMouseDown.value || !touchStartPos.value || !startBrickAddr.value) return;

    const dx = e.clientX - touchStartPos.value.x;
    const dy = e.clientY - touchStartPos.value.y;

    const SWIPE_THRESHOLD = 30; // 30픽셀 이상 움직이면 드래그로 간주
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) return;

    // 방향 계산 (스와이프 로직과 동일)
    let direction: 'up' | 'down' | 'left' | 'right';
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    const { r, c } = startBrickAddr.value;
    let targetR = r;
    let targetC = c;

    if (direction === 'up') targetR--;
    else if (direction === 'down') targetR++;
    else if (direction === 'left') targetC--;
    else if (direction === 'right') targetC++;

    // 범위 체크 후 교체 실행
    if (targetR >= 0 && targetR < 7 && targetC >= 0 && targetC < 7) {
      handleBrickClick(targetR, targetC);
    }

    // 한 번 교체되면 드래그 종료 (연속 교체 방지)
    resetMouseState();
  };

  // 3. 마우스 업 (상태 초기화)
  const onMouseUp = () => {
    resetMouseState();
  };

  const resetMouseState = () => {
    isMouseDown.value = false;
    touchStartPos.value = null;
    startBrickAddr.value = null;
  };

  return {
    onTouchStart, onTouchMove, onTouchEnd,
    onMouseDown, onMouseMove, onMouseUp // 마우스용 추가 반환
  };
};