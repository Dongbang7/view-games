import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatMain from '../components/ChatMain.vue'; // 이제 이 파일이 존재하죠!
import NewPage from '../components/NewPage.vue';
import NewPage2 from '../components/NewPage2.vue';

// 1. 실제 데이터가 담길 변수들 (나중에 API 호출 결과 등을 담게 됩니다)
const userProfile = {
  name: "유리",
  year: 2027,
  isLoggedIn: true,
  skills: ['C++Builder', 'Go', 'Python', 'Vue.js']
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    { path: '/', component: ChatMain },   // 루트 주소일 때 채팅창 표시
    { path: '/page1', component: NewPage,
      // 2. 함수 형태로 props를 정의하면 호출될 때의 변수 값을 실시간으로 넘깁니다.
      props: (route) => ({
        msgString: `${userProfile.name}님, 환영합니다!`, // 변수 조합
        msgNumber: userProfile.year,                 // 변수 대입
        msgBool: userProfile.isLoggedIn,             // 변수 대입
        msgArray: userProfile.skills                 // 배열 대입
      })
    },
    { path: '/page2', component: NewPage2, 
      props: (route) => ({
        msgString: `${userProfile.name}님, 환영!`, // 변수 조합
        msgNumber: userProfile.year,                 // 변수 대입
        msgBool: userProfile.isLoggedIn,             // 변수 대입
        msgArray: userProfile.skills                 // 배열 대입
      })
    },
    { 
      path: '/game2048',
      name: 'Game2048',
      component: () => import('../views/GameView.vue')
    },
    { 
      path: '/gameTetris',
      name: 'GameTetris',
      component: () => import('../views/TetrisView.vue')
    },
    { 
      path: '/gameMine',
      name: 'GameMine',
      component: () => import('../views/MineView.vue')
    },    
    { 
      path: '/gameBlock',
      name: 'GameBlock',
      component: () => import('../views/BlockView.vue')
    },    
    { 
      path: '/gameDragon',
      name: 'GameDragon',
      component: () => import('../views/DragonbyteView.vue')
    },
    { 
      path: '/gamePang',
      name: 'GamePang',
      component: () => import('../views/PangView.vue')
    }    
  ],
})

export default router
