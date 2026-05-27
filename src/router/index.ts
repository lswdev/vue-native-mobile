import { createRouter, createWebHistory } from 'vue-router'
import { nativeRoutes } from './routes/native.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/HomePage.vue'),
      meta: { title: '홈' },
    },
    ...nativeRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} | Vue Native Mobile`
  }
})

export default router
