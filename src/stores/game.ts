import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  // 1. State: 전역 변수 선언
  state: () => ({
    Score: 0,
    playerName: import.meta.env.VITE_MY_NAME || 'Guest',
    isGameOver: false
  }),

  // 2. Getters: 계산된 값 (C++Builder의 property와 유사)
  getters: {
    doubleScore: (state) => state.Score * 2,
    scoreStatus: (state) => state.Score > 100 ? 'High Score!' : 'Keep going!'
  },

  // 3. Actions: 변수를 바꾸는 함수
  actions: {
    addScore(points: number) {
      this.Score += points
    },
    resetGame() {
      this.Score = 0
      this.isGameOver = false
    }
  }
})