<template>
  <div class="note-list-page">
    <div class="page-header">
      <h1>我的笔记</h1>
      <div class="header-actions">
        <a-radio-group v-model="viewMode" button-style="solid">
          <a-radio-button value="list">
            <a-icon type="unordered-list" />
          </a-radio-button>
          <a-radio-button value="card">
            <a-icon type="appstore" />
          </a-radio-button>
          <a-radio-button value="timeline">
            <a-icon type="clock-circle" />
          </a-radio-button>
        </a-radio-group>

        <a-dropdown>
          <a-button>
            <a-icon type="filter" /> 筛选 <a-icon type="down" />
          </a-button>
          <a-menu slot="overlay" @click="handleFilterClick">
            <a-menu-item key="all">全部笔记</a-menu-item>
            <a-menu-item key="favorite">我的收藏</a-menu-item>
            <a-menu-item key="archived">归档笔记</a-menu-item>
            <a-menu-divider />
            <a-sub-menu title="按分类">
              <a-menu-item v-for="cat in categories" :key="`cat-${cat.id}`">
                {{ cat.name }}
              </a-menu-item>
            </a-sub-menu>
          </a-menu>
        </a-dropdown>

        <a-dropdown>
          <a-button>
            <a-icon type="sort-ascending" /> 排序 <a-icon type="down" />
          </a-button>
          <a-menu slot="overlay" @click="handleSortClick">
            <a-menu-item key="updatedAt-desc">最近更新</a-menu-item>
            <a-menu-item key="createdAt-desc">最新创建</a-menu-item>
            <a-menu-item key="title-asc">标题排序</a-menu-item>
            <a-menu-item key="viewCount-desc">浏览最多</a-menu-item>
          </a-menu>
        </a-dropdown>
      </div>
    </div>

    <div v-if="activeFilters.length > 0" class="active-filters">
      <span class="filter-label">当前筛选：</span>
      <a-tag
        v-for="filter in activeFilters"
        :key="filter.key"
        closable
        @close="removeFilter(filter.key)"
      >
        {{ filter.label }}
      </a-tag>
      <a-button type="link" size="small" @click="clearAllFilters">清除所有</a-button>
    </div>

    <a-spin :spinning="loading" tip="加载中...">
      <div v-if="filteredNotes.length === 0" class="empty-state">
        <a-empty description="暂无笔记">
          <a-button type="primary" @click="createNote">
            <a-icon type="plus" /> 创建第一篇笔记
          </a-button>
        </a-empty>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" class="note-list">
        <a-list
          :data-source="paginatedNotes"
          :pagination="pagination"
          @change="handlePageChange"
        >
          <a-list-item
            slot="renderItem"
            slot-scope="note"
            :key="note.id"
            class="note-list-item"
            @click="viewNote(note.id)"
          >
            <a-list-item-meta>
              <a-avatar slot="avatar" :style="{ backgroundColor: getCategoryColor(note.categoryId) }">
                <a-icon :type="getCategoryIcon(note.categoryId)" />
              </a-avatar>
              <template slot="title">
                <div class="note-title">
                  {{ note.title }}
                  <a-icon v-if="note.isFavorite" type="star" theme="filled" class="favorite-icon" />
                </div>
              </template>
              <template slot="description">
                <div class="note-meta">
                  <span class="meta-item">
                    <a-icon type="folder" /> {{ getCategoryName(note.categoryId) }}
                  </span>
                  <span class="meta-item">
                    <a-icon type="calendar" /> {{ formatDate(note.updatedAt) }}
                  </span>
                  <span class="meta-item">
                    <a-icon type="eye" /> {{ note.viewCount }}
                  </span>
                  <span v-if="note.tags.length > 0" class="meta-item">
                    <a-icon type="tags" />
                    <a-tag v-for="tag in note.tags.slice(0, 3)" :key="tag" size="small">
                      {{ tag }}
                    </a-tag>
                    <span v-if="note.tags.length > 3">+{{ note.tags.length - 3 }}</span>
                  </span>
                </div>
                <div class="note-excerpt">{{ getExcerpt(note.content) }}</div>
              </template>
            </a-list-item-meta>
            <template slot="actions">
              <a-tooltip title="编辑">
                <a-button
                  type="link"
                  icon="edit"
                  @click.stop="editNote(note.id)"
                />
              </a-tooltip>
              <a-tooltip :title="note.isFavorite ? '取消收藏' : '收藏'">
                <a-button
                  type="link"
                  :icon="note.isFavorite ? 'star' : 'star-o'"
                  @click.stop="toggleFavorite(note.id)"
                />
              </a-tooltip>
              <a-dropdown>
                <a-button type="link" icon="ellipsis" @click.stop />
                <a-menu slot="overlay" @click="(e) => handleNoteAction(e, note)">
                  <a-menu-item key="archive">
                    <a-icon type="inbox" /> {{ note.isArchived ? '取消归档' : '归档' }}
                  </a-menu-item>
                  <a-menu-item key="export">
                    <a-icon type="export" /> 导出
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" style="color: #ff4d4f">
                    <a-icon type="delete" /> 删除
                  </a-menu-item>
                </a-menu>
              </a-dropdown>
            </template>
          </a-list-item>
        </a-list>
      </div>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="note-cards">
        <a-row :gutter="[16, 16]">
          <a-col
            v-for="note in paginatedNotes"
            :key="note.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <note-card
              :note="note"
              @click="viewNote(note.id)"
              @edit="editNote(note.id)"
              @favorite="toggleFavorite(note.id)"
              @delete="deleteNote(note.id)"
            />
          </a-col>
        </a-row>
        <div class="pagination-wrapper">
          <a-pagination
            v-model="currentPage"
            :total="filteredNotes.length"
            :page-size="pageSize"
            :show-size-changer="true"
            :show-quick-jumper="true"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </div>

      <!-- 时间线视图 -->
      <div v-else-if="viewMode === 'timeline'" class="note-timeline">
        <a-timeline>
          <a-timeline-item
            v-for="note in paginatedNotes"
            :key="note.id"
            :color="note.isFavorite ? 'red' : 'blue'"
          >
            <template slot="dot">
              <a-icon :type="note.isMarkdown ? 'file-markdown' : 'file-text'" />
            </template>
            <div class="timeline-item" @click="viewNote(note.id)">
              <div class="timeline-header">
                <h3>{{ note.title }}</h3>
                <span class="timeline-date">{{ formatDate(note.createdAt) }}</span>
              </div>
              <div class="timeline-content">
                <p>{{ getExcerpt(note.content) }}</p>
                <div class="timeline-tags">
                  <a-tag v-for="tag in note.tags" :key="tag" size="small">{{ tag }}</a-tag>
                </div>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        <div class="pagination-wrapper">
          <a-pagination
            v-model="currentPage"
            :total="filteredNotes.length"
            :page-size="pageSize"
            @change="handlePageChange"
          />
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { notes } from '@/store/modules/notes';
import { categories } from '@/store/modules/categories';
import { Note, Category } from '@/types';
import NoteCard from '@/components/business/NoteCard.vue';
import moment from 'moment';

interface ActiveFilter {
  key: string;
  label: string;
}

@Component({
  components: {
    NoteCard,
  },
})
export default class NoteList extends Vue {
  viewMode: 'list' | 'card' | 'timeline' = 'list';
  currentPage = 1;
  pageSize = 10;

  get loading() {
    return notes.loadingState === 'loading';
  }

  get filteredNotes() {
    return notes.filteredNotes;
  }

  get paginatedNotes() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNotes.slice(start, end);
  }

  get pagination() {
    return {
      current: this.currentPage,
      pageSize: this.pageSize,
      total: this.filteredNotes.length,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条`,
      pageSizeOptions: ['10', '20', '50', '100'],
    };
  }

  get categories() {
    return categories.categoriesTree;
  }

  get activeFilters(): ActiveFilter[] {
    const filters: ActiveFilter[] = [];
    const noteFilter = notes.filter;

    if (noteFilter.keyword) {
      filters.push({ key: 'keyword', label: `关键词: ${noteFilter.keyword}` });
    }
    if (noteFilter.categoryId) {
      const cat = this.getCategoryById(noteFilter.categoryId);
      filters.push({ key: 'category', label: `分类: ${cat?.name || ''}` });
    }
    if (noteFilter.isFavorite) {
      filters.push({ key: 'favorite', label: '收藏' });
    }
    if (noteFilter.isArchived) {
      filters.push({ key: 'archived', label: '归档' });
    }
    if (noteFilter.tags && noteFilter.tags.length > 0) {
      noteFilter.tags.forEach(tag => {
        filters.push({ key: `tag-${tag}`, label: `标签: ${tag}` });
      });
    }

    return filters;
  }

  mounted() {
    this.loadNotes();
    this.loadViewMode();
  }

  async loadNotes() {
    await notes.fetchNotes();
  }

  loadViewMode() {
    const savedMode = localStorage.getItem('note-view-mode');
    if (savedMode) {
      this.viewMode = savedMode as any;
    }
  }

  @Watch('viewMode')
  onViewModeChange(mode: string) {
    localStorage.setItem('note-view-mode', mode);
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  getCategoryName(categoryId: string): string {
    const cat = this.getCategoryById(categoryId);
    return cat?.name || '未分类';
  }

  getCategoryColor(categoryId: string): string {
    const cat = this.getCategoryById(categoryId);
    return cat?.color || '#1890ff';
  }

  getCategoryIcon(categoryId: string): string {
    const cat = this.getCategoryById(categoryId);
    return cat?.icon || 'folder';
  }

  formatDate(date: Date): string {
    return moment(date).format('YYYY-MM-DD HH:mm');
  }

  getExcerpt(content: string, length = 100): string {
    const plainText = content
      .replace(/[#*`~_\[\]()!]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (plainText.length <= length) return plainText;
    return plainText.slice(0, length) + '...';
  }

  handleFilterClick({ key }: { key: string }) {
    if (key === 'all') {
      notes.CLEAR_FILTER();
    } else if (key === 'favorite') {
      notes.SET_FILTER({ isFavorite: true });
    } else if (key === 'archived') {
      notes.SET_FILTER({ isArchived: true });
    } else if (key.startsWith('cat-')) {
      const categoryId = key.replace('cat-', '');
      notes.SET_FILTER({ categoryId });
    }
  }

  handleSortClick({ key }: { key: string }) {
    const [field, order] = key.split('-');
    notes.SET_SORT_OPTIONS({
      field: field as any,
      order: order as any,
    });
  }

  removeFilter(key: string) {
    if (key === 'keyword') {
      notes.SET_FILTER({ keyword: '' });
    } else if (key === 'category') {
      notes.SET_FILTER({ categoryId: '' });
    } else if (key === 'favorite') {
      notes.SET_FILTER({ isFavorite: false });
    } else if (key === 'archived') {
      notes.SET_FILTER({ isArchived: false });
    } else if (key.startsWith('tag-')) {
      const tag = key.replace('tag-', '');
      const currentTags = notes.filter.tags || [];
      notes.SET_FILTER({
        tags: currentTags.filter(t => t !== tag),
      });
    }
  }

  clearAllFilters() {
    notes.CLEAR_FILTER();
  }

  handlePageChange(page: number, pageSize?: number) {
    this.currentPage = page;
    if (pageSize) {
      this.pageSize = pageSize;
    }
  }

  handleSizeChange(current: number, size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  viewNote(id: string) {
    this.$router.push(`/notes/${id}`);
  }

  editNote(id: string) {
    this.$router.push(`/notes/${id}/edit`);
  }

  createNote() {
    this.$router.push('/notes/new');
  }

  async toggleFavorite(id: string) {
    await notes.toggleFavorite(id);
  }

  async deleteNote(id: string) {
    this.$confirm({
      title: '确认删除',
      content: '确定要删除这篇笔记吗？此操作不可恢复。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await notes.deleteNote(id);
        this.$message.success('删除成功');
      },
    });
  }

  handleNoteAction({ key }: { key: string }, note: Note) {
    if (key === 'archive') {
      notes.toggleArchive(note.id);
    } else if (key === 'export') {
      this.exportNote(note);
    } else if (key === 'delete') {
      this.deleteNote(note.id);
    }
  }

  exportNote(note: Note) {
    // 实现导出功能
    const content = `# ${note.title}\n\n${note.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.$message.success('导出成功');
  }
}
</script>

<style lang="scss" scoped>
.note-list-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .active-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 4px;

    .filter-label {
      font-weight: 500;
    }
  }

  .empty-state {
    padding: 80px 0;
    text-align: center;
  }

  .note-list {
    .note-list-item {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #f5f5f5;
      }

      .note-title {
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;

        .favorite-icon {
          color: #faad14;
        }
      }

      .note-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #8c8c8c;
          font-size: 12px;

          .anticon {
            font-size: 12px;
          }
        }
      }

      .note-excerpt {
        color: #595959;
        line-height: 1.5;
      }
    }
  }

  .note-cards {
    .pagination-wrapper {
      margin-top: 24px;
      text-align: center;
    }
  }

  .note-timeline {
    .timeline-item {
      cursor: pointer;
      padding: 16px;
      background: #fafafa;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background: #f0f0f0;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        h3 {
          margin: 0;
          font-size: 16px;
        }

        .timeline-date {
          color: #8c8c8c;
          font-size: 12px;
        }
      }

      .timeline-content {
        p {
          margin: 0;
          color: #595959;
          line-height: 1.5;
        }

        .timeline-tags {
          margin-top: 8px;
        }
      }
    }

    .pagination-wrapper {
      margin-top: 24px;
      text-align: center;
    }
  }
}
</style>
