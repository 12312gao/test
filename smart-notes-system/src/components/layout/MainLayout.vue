<template>
  <a-layout class="main-layout">
    <a-layout-sider
      v-model="collapsed"
      :trigger="null"
      collapsible
      class="layout-sider"
    >
      <div class="logo">
        <a-icon type="book" />
        <span v-if="!collapsed" class="logo-text">智能笔记</span>
      </div>
      <a-menu
        theme="dark"
        mode="inline"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
      >
        <a-menu-item key="notes">
          <a-icon type="file-text" />
          <span>笔记列表</span>
        </a-menu-item>
        <a-menu-item key="categories">
          <a-icon type="folder" />
          <span>分类管理</span>
        </a-menu-item>
        <a-menu-item key="dashboard">
          <a-icon type="bar-chart" />
          <span>数据统计</span>
        </a-menu-item>
        <a-menu-item key="settings">
          <a-icon type="setting" />
          <span>系统设置</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="layout-header">
        <a-icon
          class="trigger"
          :type="collapsed ? 'menu-unfold' : 'menu-fold'"
          @click="() => (collapsed = !collapsed)"
        />
        <div class="header-content">
          <search-bar class="header-search" />
          <div class="header-actions">
            <a-button type="primary" icon="plus" @click="createNote">
              新建笔记
            </a-button>
            <a-dropdown>
              <a-avatar icon="user" class="user-avatar" />
              <a-menu slot="overlay">
                <a-menu-item key="profile">
                  <a-icon type="user" />
                  个人资料
                </a-menu-item>
                <a-menu-item key="theme">
                  <a-icon type="skin" />
                  主题设置
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout">
                  <a-icon type="logout" />
                  退出登录
                </a-menu-item>
              </a-menu>
            </a-dropdown>
          </div>
        </div>
      </a-layout-header>
      <a-layout-content class="layout-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import SearchBar from '@/components/business/SearchBar.vue';

@Component({
  components: {
    SearchBar,
  },
})
export default class MainLayout extends Vue {
  collapsed = false;

  get selectedKeys() {
    const routeName = this.$route.name;
    const keyMap: Record<string, string> = {
      NoteList: 'notes',
      NoteCreate: 'notes',
      NoteDetail: 'notes',
      NoteEdit: 'notes',
      CategoryManage: 'categories',
      Dashboard: 'dashboard',
      Settings: 'settings',
    };
    return [keyMap[routeName as string] || 'notes'];
  }

  handleMenuClick({ key }: { key: string }) {
    const routeMap: Record<string, string> = {
      notes: '/notes',
      categories: '/categories',
      dashboard: '/dashboard',
      settings: '/settings',
    };
    this.$router.push(routeMap[key]);
  }

  createNote() {
    this.$router.push('/notes/new');
  }

  @Watch('$route')
  onRouteChange() {
    // 路由变化时的处理
  }

  mounted() {
    // 恢复侧边栏状态
    const savedCollapsed = localStorage.getItem('sider-collapsed');
    if (savedCollapsed !== null) {
      this.collapsed = savedCollapsed === 'true';
    }
  }

  @Watch('collapsed')
  onCollapsedChange(val: boolean) {
    localStorage.setItem('sider-collapsed', String(val));
  }
}
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;

  .layout-sider {
    background: #001529;
    box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);

    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      gap: 8px;

      .anticon {
        font-size: 24px;
      }

      .logo-text {
        transition: all 0.3s;
      }
    }
  }

  .layout-header {
    background: #fff;
    padding: 0 24px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

    .trigger {
      font-size: 20px;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #1890ff;
      }
    }

    .header-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-left: 24px;

      .header-search {
        flex: 1;
        max-width: 400px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        .user-avatar {
          cursor: pointer;
        }
      }
    }
  }

  .layout-content {
    margin: 24px;
    background: #f0f2f5;

    .content-wrapper {
      background: #fff;
      padding: 24px;
      min-height: calc(100vh - 64px - 48px);
      border-radius: 4px;
    }
  }
}
</style>
