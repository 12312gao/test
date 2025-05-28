<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'App',
})
export default class App extends Vue {
  mounted() {
    // 初始化应用
    this.initApp();
  }

  initApp() {
    // 加载用户偏好设置
    this.loadUserPreferences();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
    
    // 监听网络状态
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  loadUserPreferences() {
    // 加载主题
    const theme = localStorage.getItem('app-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    
    // 加载其他偏好设置
    const preferences = localStorage.getItem('user-preferences');
    if (preferences) {
      try {
        const prefs = JSON.parse(preferences);
        this.$store.commit('user/SET_PREFERENCES', prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }

  handleResize = () => {
    // 处理响应式布局
    const width = window.innerWidth;
    this.$store.commit('app/SET_SCREEN_WIDTH', width);
  };

  handleOnline = () => {
    this.$message.success('网络已连接');
  };

  handleOffline = () => {
    this.$message.warning('网络已断开，部分功能可能受限');
  };

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  overflow: hidden;
}

// 自定义滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;

  &:hover {
    background: #a8a8a8;
  }
}
</style>
