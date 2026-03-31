// src/composables/useSound.ts

export const useSound = () => {
  // 사운드 파일 경로 (public 폴더에 넣어두세요)
  const pangSound = new Audio(`${import.meta.env.BASE_URL}sounds/pang.mp3`);
  const bombSound = new Audio(`${import.meta.env.BASE_URL}sounds/bomb.mp3`);
  const comboSound = new Audio(`${import.meta.env.BASE_URL}sounds/combo.mp3`);
  pangSound.volume = 0.1;
  bombSound.volume = 0.1;
  comboSound.volume = 0.1;

  const playPang = () => {
    pangSound.currentTime = 0; // 재생 위치 초기화 (연속 클릭 대비)
    pangSound.play().catch(() => {}); // 브라우저 정책상 첫 클릭 전 재생 방지
  };

  const playBomb = () => {
    bombSound.currentTime = 0;
    bombSound.play().catch(() => {});
  };

  const playCombo = (count: number) => {
    // 콤보가 높을수록 피치를 올리는 등의 재미를 줄 수도 있습니다.
    comboSound.currentTime = 0;
    comboSound.play().catch(() => {});
  };

  return { playPang, playBomb, playCombo };
};