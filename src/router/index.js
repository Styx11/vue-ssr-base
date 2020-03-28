import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default function createRouter() {
  return new Router({

    // SSR 必须使用 history 模式
    mode: 'history',

    routes: [
      { path: '/', component: () => import('../components/Hello.vue') },
      { path: '/test', component: () => import('../components/Test.vue') }
    ],
  });
};