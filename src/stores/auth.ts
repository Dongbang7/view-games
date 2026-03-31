import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    ID : '동방',
    userName: '유리',
    isLoggedIn: true,
    lastLogin: '2026-03-26'
  }),
  actions: {
    logout() { 
        this.isLoggedIn = false 
    },
    // 빌더의 Member Function처럼 데이터를 조작하는 함수
    updateName(newName: string) {
      this.userName = newName;
    }
  }
})