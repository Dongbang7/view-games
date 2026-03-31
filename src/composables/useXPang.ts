// src/composables/useXPang.ts

import { ref, watch, computed, onMounted } from 'vue';
import { useSound } from './useSound';

// 벽돌 종류 (C++의 enum 대용, 숫자나 문자열로 정의)
// 0: 빈칸, 1~5: 동물 종류
export type BrickType = 0 | 1 | 2 | 3 | 4 | 5 | 99; // 99번은 폭탄!

// 벽돌 한 칸의 구조 (C++의 struct 대용)
export interface IBrick {
  id: number;     // 애니메이션 식별을 위한 고유 ID
  type: BrickType; // 동물의 종류
}

// 보드 크기 설정
const BOARD_SIZE = 7;



export const useXPang = () => {

  const { playPang, playBomb, playCombo } = useSound();
  

  const score = ref(0);
  const combo = ref(0); // 연속으로 터질 때마다 올라가는 카운트
  const isGameOver = ref(false);

  // 반응형 보드 상태 (7x7 IBrick 배열)
  const board = ref<IBrick[][]>([]);
  let nextId = 1; // 고유 ID 생성을 위한 카운터
  // 현재 선택된 벽돌의 좌표 { r, c }
  const selectedAddr = ref<{ r: number; c: number } | null>(null);

  const timeLeft = ref(60); // 60초 제한
  const isGameActive = ref(false); // 게임 진행 상태
  let timerInterval: number | null = null;


  // 타이머를 확실히 죽이는 전용 함수
  const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        console.log("XPang 타이머 물리적 제거 완료");
    }
  };

  const isPaused = ref(false);

  const pauseGame = () => {
    if (isGameActive.value && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused.value = true;
        console.log("게임 일시정지");
    }
  };

  const resumeGame = () => {
    if (isGameActive.value && isPaused.value && !timerInterval) {
        isPaused.value = false;
        // 타이머 재가동
        timerInterval = window.setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            endGame();
        }
        }, 1000);
        console.log("게임 재개");
    }
  };

  const startGame = () => {
    score.value = 0;
    timeLeft.value = 100;
    isGameActive.value = true;
    initBoard(); // 보드 초기화
    
    // 1초마다 시간 감소
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            endGame();
        }
    }, 1000);
  };

  const endGame = () => {
    isGameActive.value = false;
    if (timerInterval) clearInterval(timerInterval);
    //alert(`게임 종료! 최종 점수: ${score.value}점`);
  };

  // 랜덤한 벽돌 생성 함수
  const createRandomBrickOld = (): IBrick => ({
    id: nextId++,
    type: (Math.floor(Math.random() * 5) + 1) as BrickType, // 1~5 랜덤
  });
  // 폭탄이 나올 확률을 확 줄인다.
  const createRandomBrick = (): IBrick => {
    let rand = Math.floor(Math.random() * 5) + 1;
    const brick = {
        id: nextId++,
        type: rand as BrickType, // 1~5 랜덤
    };
    
    return brick;
  };

  // 보드 초기화 함수 (2중 for문); startGane에서 불려진다.
  const initBoard = () => {
    const newBoard: IBrick[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        newBoard[r]![c] = createRandomBrick();
      }
    }
    
    // 초기 생성 시에도 3개 맞춤이 있으면 안 되지만, 일단 기본 생성 로직만 구현
    board.value = newBoard;
  };

  // 컴포넌트 마운트 시 초기화 실행
  onMounted(() => {
    initBoard();
  });

  // 터진 개수와 현재 콤보를 바탕으로 점수 계산
  const updateScore = (matchCount: number) => {
    // 기본점수: 개당 10점 + 콤보 보너스: 콤보당 50점 가산
    const addedScore = (matchCount * 10) + (combo.value * 50);
    score.value += addedScore;
  };

  // 핵심 알고리즘: 매칭 체크 (checkMatches)
  // 가장 중요한 '팡' 터지는 로직입니다. C++의 std::vector를 쓰듯, 배열 함수(forEach, map)를 활용해 가로, 세로 매칭을 전수 조사합니다.
  // 가로/세로 매칭을 체크하고 터뜨릴 벽돌의 좌표(r, c)를 반환
  const checkMatches = (): { r: number; c: number }[] => {
    const matchedCoordinates: { r: number; c: number }[] = [];
    const currentBoard = board.value;

    // 1. 가로 매칭 체크 (for-loop)
    for (let r = 0; r < BOARD_SIZE; r++) {
      let count = 1;
      for (let c = 0; c < BOARD_SIZE - 1; c++) {
        if (currentBoard[r]![c]!.type !== 0 && currentBoard[r]![c]!.type === currentBoard[r]![c + 1]!.type) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 0; i < count; i++) {
              matchedCoordinates.push({ r, c: c - i });
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matchedCoordinates.push({ r, c: BOARD_SIZE - 1 - i });
        }
      }
    }

    // 2. 세로 매칭 체크 (for-loop)
    for (let c = 0; c < BOARD_SIZE; c++) {
      let count = 1;
      for (let r = 0; r < BOARD_SIZE - 1; r++) {
        if (currentBoard[r]![c]!.type !== 0 && currentBoard[r]![c]!.type === currentBoard[r + 1]![c]!.type) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 0; i < count; i++) {
              matchedCoordinates.push({ r: r - i, c });
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          matchedCoordinates.push({ r: BOARD_SIZE - 1 - i, c });
        }
      }
    }

    return matchedCoordinates;
  };

  // 두 좌표가 인접한지 체크 (상하좌우 1칸)
  const isAdjacent = (addr1: { r: number; c: number }, addr2: { r: number; c: number }) => {
    const rowDiff = Math.abs(addr1.r - addr2.r);
    const colDiff = Math.abs(addr1.c - addr2.c);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // 두 벽돌의 위치를 실제로 교체하는 함수 (C++의 Swap)
  const swapBricks = (addr1: { r: number; c: number }, addr2: { r: number; c: number }) => {
    const row1 = board.value[addr1.r];
    const row2 = board.value[addr2.r];
    //const temp = board.value[addr1.r]![addr1.c];
    //board.value[addr1.r][addr1.c] = board.value[addr2.r]![addr2.c];
    //board.value[addr2.r][addr2.c] = temp;
    // row1과 row2가 존재할 때만 실행하도록 if문을 걸면 물결이 완벽히 사라집니다.
    //if (row1 && row2) {
    // 2. 각 행의 해당 열(column) 데이터도 존재하는지 확인
    if (row1 && row2) { //} && row1[addr1.c] !== undefined && row2[addr2.c] !== undefined) {
        const temp = row1[addr1.c] as IBrick;
        row1[addr1.c] = row2[addr2.c] as IBrick;;
        row2[addr2.c] = temp;
    }
  };

  // 핵심: 터진 칸을 채우는 '중력' 함수
  const applyGravity = async () => {
    const currentBoard = board.value; 

    // 각 열(Column)을 하나씩 처리합니다.
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyRow: number = BOARD_SIZE - 1; // 아래서부터 빈칸을 찾을 포인터

      // 1단계: 아래서부터 위로 올라가며 빈칸이 아닌 것들을 아래로 채웁니다.
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const currentRow = currentBoard[r];
        const targetRow = currentBoard[emptyRow];
        
        //if (currentBoard[r]![c]!.type !== 0) {
          // 현재 칸이 비어있지 않다면 emptyRow 위치로 이동
        //  if (r !== emptyRow) {
        //    currentBoard[emptyRow][c] = currentBoard[r]![c];
        //    currentBoard[r]![c] = { id: nextId++, type: 0 }; // 옮긴 자리는 일단 비움
        if (currentRow && targetRow && currentRow[c]?.type !== 0) {
          if (r !== emptyRow) {
            // 이제 targetRow[c]에는 물결이 생기지 않습니다.
            targetRow[c] = currentRow[c]!;
            currentRow[c] = { id: nextId++, type: 0 }; // 옮긴 자리는 일단 비움
          }
          emptyRow--;
        }
      }

      // 2단계: 맨 위에서부터 남은 빈칸들을 새 벽돌로 채웁니다.
      for (let r = emptyRow; r >= 0; r--) {
        currentBoard[r]![c] = createRandomBrick();
      }
    }
  };

  // 벽돌 터뜨리기 함수
  const processMatch = async (matches: { r: number; c: number }[]) => {
    if (matches.length === 0) {
      combo.value = 0; // 터질 게 없으면 콤보 리셋
      return;
    }

    // 1. 일반 팡 vs 폭탄 소리 구분
    const hasBomb = matches.some(m => board.value[m.r]![m.c]!.type === 99);
    
    if (hasBomb) {
      playBomb(); // 콰광!
    } else {
      playPang(); // 팡!
    }

    // 2. 콤보가 높으면 추가 소리
    if (combo.value > 2) {
      playCombo(combo.value);
    }

    combo.value++; // 연쇄 폭발 시 콤보 증가
    updateScore(matches.length);

    // 1. 매칭된 곳을 0으로 변경
    matches.forEach(({ r, c }) => {
      board.value[r]![c]!.type = 0;
    });

    // 2. 약간의 지연 시간 (팡! 터지는 걸 눈으로 확인하기 위해)
    await new Promise(resolve => setTimeout(resolve, 300));

    // 3. 중력 적용
    await applyGravity();
    
    // 4. 새로 채워진 후 또 맞은 게 있는지 재검사 (재귀적 콤보!)
    const nextMatches = checkMatches();
    if (nextMatches.length > 0) {
      await processMatch(nextMatches);
    } else {
      // 더 이상 터질 게 없으면 이번 턴의 콤보 종료
      setTimeout(() => { combo.value = 0; }, 500);
    }

    // processMatch 함수의 마지막 부분에 추가
    if (nextMatches.length === 0) {
      setTimeout(() => {
        if (!checkPossibleMoves()) {
            isGameOver.value = true;
            alert("더 이상 움직일 수 없습니다! Game Over!");
        }
      }, 500);
    }

    // **  폭탄이 나올 확률을 조정한다.
    if (matches.length >= 4) {      // 먼저 매치 갯수를 살피고. n개 이상 매치가 발견 될때만.
        if (Math.floor(Math.random() * 2.9) == 0) {   // 그 경우 다시 랜덤으로 폭탄을 결정한다.
            // 터진 자리 중 하나(예: 첫 번째 좌표)를 폭탄으로 변경
            const center = matches[0];
            board.value[center!.r]![center!.c]!.type = 99;
        }
    }
  };

  // 
  const handleBrickClick = async (r: number, c: number) => {
    const clickedBrick = board.value[r]![c];

    // 만약 폭탄을 클릭했다면?
    if (clickedBrick!.type === 99) {
        // 맵 전체에서 랜덤한 한 가지 색상을 모두 제거!
        const targetType = (Math.floor(Math.random() * 5) + 1) as BrickType;
        const targets: {r: number, c: number}[] = [];
        
        board.value.forEach((row, ri) => {
        row.forEach((cell, ci) => {
                if (cell.type === targetType || (ri === r && ci === c)) {
                    targets.push({ r: ri, c: ci });
                }
            });
        });
        
        await processMatch(targets); // 추출된 타겟들을 한꺼번에 팡!
        return;
    }

    if (!selectedAddr.value) {
        selectedAddr.value = { r, c };
        return;
    }

    const first = selectedAddr.value;
    const second = { r, c };

    if (isAdjacent(first, second)) {
        swapBricks(first, second);

        const matches = checkMatches();
        
        if (matches.length > 0) {
        selectedAddr.value = null; // 선택 해제
        await processMatch(matches); // 터뜨리고 채우기 실행!
      } else {
        // 3개가 안 맞으면 원상복구
        setTimeout(() => {
            swapBricks(first, second);
            selectedAddr.value = null;
        }, 300);
      }
    } else {
        selectedAddr.value = second;
    }

    if (isAdjacent(first, second)) {
        swapBricks(first, second);
        
        const matches = checkMatches();
        
      if (matches.length > 0) {
        selectedAddr.value = null;
        await processMatch(matches);
      } else {
        // 3개가 안 맞으면 원상복구 (시간 단축)
        setTimeout(() => {
            swapBricks(first, second);
            selectedAddr.value = null;
            }, 200); // 0.2초로 단축
      }
    } else {
      selectedAddr.value = second;
    }
  };

  const checkPossibleMoves = (): boolean => {
    const b = board.value;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
        // 오른쪽 칸과 바꿔보기
        if (c < BOARD_SIZE - 1) {
            if (canMatchAfterSwap(r, c, r, c + 1)) return true;
        }
        // 아래쪽 칸과 바꿔보기
        if (r < BOARD_SIZE - 1) {
            if (canMatchAfterSwap(r, c, r + 1, c)) return true;
        }
        }
    }
    return false;
  };

  // 가상으로 바꿔보고 매칭되는지 확인하는 헬퍼 함수
  const canMatchAfterSwap = (r1: number, c1: number, r2: number, c2: number): boolean => {
    // 실제 보드를 건드리지 않게 조심! (가상 교체)
    const tempType = board.value[r1]![c1]!.type;
    board.value[r1]![c1]!.type = board.value[r2]![c2]!.type;
    board.value[r2]![c2]!.type = tempType;

    const matches = checkMatches(); // 기존에 만든 매칭 체크 함수 활용

    // 다시 원상복구
    board.value[r2]![c2]!.type = board.value[r1]![c1]!.type;
    board.value[r1]![c1]!.type = tempType;

    return matches.length > 0;
  };

  // 감시자(Watcher) 설정: 현재 페이지가 내가 아니면 타이머 정지!
/*
  watch(() => props.activePage, (newPage) => {
    if (newPage !== 'gamePang') {
      // 1. 다른 페이지로 갔을 때: 타이머 일시정지
      pauseGame(); 
      console.log("xPang: 비활성화되어 타이머를 멈춥니다.");
    } else {
      // 2. 다시 내 페이지로 왔을 때: 게임 중이었다면 재개
      if (isGameActive.value) {
        resumeGame();
        console.log("xPang: 다시 활성화되어 게임을 재개합니다.");
      }
    }
  });
*/

  // 브라우저 탭 자체를 내렸을 때도 대비 (이건 덤!)
  onMounted(() => {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) pauseGame();
        //else if (props.activePage === 'gamePang' && isGameActive.value) resumeGame();
    });
  });

  return {
    board,
    BOARD_SIZE,
    initBoard,
    checkMatches,
    processMatch,
    selectedAddr,
    isAdjacent,
    swapBricks,
    handleBrickClick,
    score,
    combo,
    startGame,
    endGame,
    timeLeft,
    isGameActive,
    resumeGame,
    pauseGame,
    isPaused,
    stopTimer,
  };
};

