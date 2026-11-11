import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Strudel Editor',
      component: () => import('@/views/Tools/StrudelEditor/StrudelEditor.vue')
    },
    {
      // Links from the old lab address (/tools/StrudelEditor?tab=...) keep their query.
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: (to) => ({ path: '/', query: to.query, hash: to.hash })
    }
  ]
})

export default router
