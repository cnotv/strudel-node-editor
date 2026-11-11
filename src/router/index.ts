import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Strudel Editor',
      component: () => import('@webgamekit/strudel-editor').then((module) => module.StrudelEditor)
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
