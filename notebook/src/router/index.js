import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import CreationCenter from '../views/CreationCenter.vue'
import NovelsManagement from '../views/NovelsManagement.vue'
import CharactersArchive from '../views/CharactersArchive.vue'
import AIAssistant from '../views/AIAssistant.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  {
    path: '/',
    name: 'CreationCenter',
    component: CreationCenter,
    meta: {
      title: '创作中心 - 故事工坊'
    }
  },
  {
    path: '/novels',
    name: 'NovelsManagement',
    component: NovelsManagement,
    meta: {
      title: '作品管理 - 故事工坊'
    }
  },
  {
    path: '/characters',
    name: 'CharactersArchive',
    component: CharactersArchive,
    meta: {
      title: '角色档案 - 故事工坊'
    }
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: AIAssistant,
    meta: {
      title: 'AI助手 - 故事工坊'
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: {
      title: '数据洞察 - 故事工坊'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router