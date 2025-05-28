import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/notes',
    children: [
      {
        path: 'notes',
        name: 'NoteList',
        component: () => import(/* webpackChunkName: "notes" */ '@/views/notes/NoteList.vue'),
        meta: {
          title: '笔记列表',
          icon: 'file-text',
        },
      },
      {
        path: 'notes/new',
        name: 'NoteCreate',
        component: () => import(/* webpackChunkName: "notes" */ '@/views/notes/NoteEdit.vue'),
        meta: {
          title: '新建笔记',
          icon: 'plus',
        },
      },
      {
        path: 'notes/:id',
        name: 'NoteDetail',
        component: () => import(/* webpackChunkName: "notes" */ '@/views/notes/NoteDetail.vue'),
        meta: {
          title: '笔记详情',
        },
      },
      {
        path: 'notes/:id/edit',
        name: 'NoteEdit',
        component: () => import(/* webpackChunkName: "notes" */ '@/views/notes/NoteEdit.vue'),
        meta: {
          title: '编辑笔记',
        },
      },
      {
        path: 'categories',
        name: 'CategoryManage',
        component: () =>
          import(/* webpackChunkName: "categories" */ '@/views/categories/CategoryManage.vue'),
        meta: {
          title: '分类管理',
          icon: 'folder',
        },
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () =>
          import(/* webpackChunkName: "statistics" */ '@/views/statistics/Dashboard.vue'),
        meta: {
          title: '数据统计',
          icon: 'bar-chart',
        },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import(/* webpackChunkName: "settings" */ '@/views/settings/Settings.vue'),
        meta: {
          title: '系统设置',
          icon: 'setting',
        },
      },
    ],
  },
  {
    path: '*',
    redirect: '/',
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  },
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  const title = to.meta.title || '智能笔记系统';
  document.title = `${title} - Smart Notes`;
  
  next();
});

export default router;
