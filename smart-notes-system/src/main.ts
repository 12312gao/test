import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import '@/assets/styles/global.scss';
import '@/api/mock';
import moment from 'moment';
import 'moment/locale/zh-cn';

// 配置moment中文
moment.locale('zh-cn');

// 使用Ant Design Vue
Vue.use(Antd);

// 全局配置
Vue.config.productionTip = false;

// 全局错误处理
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info);
  // 可以在这里添加错误上报逻辑
};

// 全局过滤器
Vue.filter('formatDate', (value: string | Date, format = 'YYYY-MM-DD HH:mm') => {
  if (!value) return '';
  return moment(value).format(format);
});

Vue.filter('fromNow', (value: string | Date) => {
  if (!value) return '';
  return moment(value).fromNow();
});

Vue.filter('truncate', (value: string, length = 100) => {
  if (!value) return '';
  if (value.length <= length) return value;
  return value.slice(0, length) + '...';
});

// 全局指令
Vue.directive('focus', {
  inserted: (el) => {
    el.focus();
  },
});

Vue.directive('click-outside', {
  bind(el: any, binding) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unbind(el: any) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  },
});

// 创建Vue实例
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
