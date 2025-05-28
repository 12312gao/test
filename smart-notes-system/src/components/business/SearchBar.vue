<template>
  <div class="search-bar">
    <a-input-search
      v-model="searchKeyword"
      placeholder="搜索笔记..."
      enter-button="搜索"
      size="large"
      :loading="searching"
      @search="handleSearch"
      @change="handleInputChange"
    >
      <a-icon slot="prefix" type="search" />
    </a-input-search>
    
    <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
      <div class="suggestion-header">搜索建议</div>
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        class="suggestion-item"
        @click="selectSuggestion(suggestion)"
      >
        <a-icon type="file-text" class="suggestion-icon" />
        <div class="suggestion-content">
          <div class="suggestion-title" v-html="highlightKeyword(suggestion.title)"></div>
          <div class="suggestion-text" v-html="highlightKeyword(suggestion.excerpt)"></div>
        </div>
      </div>
    </div>

    <a-modal
      v-model="showAdvanced"
      title="高级搜索"
      width="600px"
      @ok="handleAdvancedSearch"
    >
      <a-form :form="form" layout="vertical">
        <a-form-item label="关键词">
          <a-input v-decorator="['keyword']" placeholder="输入搜索关键词" />
        </a-form-item>
        
        <a-form-item label="分类">
          <a-select v-decorator="['categoryId']" placeholder="选择分类" allowClear>
            <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="标签">
          <a-select
            v-decorator="['tags']"
            mode="multiple"
            placeholder="选择标签"
            allowClear
          >
            <a-select-option v-for="tag in tags" :key="tag.name" :value="tag.name">
              {{ tag.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="日期范围">
          <a-range-picker
            v-decorator="['dateRange']"
            style="width: 100%"
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-decorator="['isFavorite', { valuePropName: 'checked' }]">
            仅收藏
          </a-checkbox>
          <a-checkbox v-decorator="['isArchived', { valuePropName: 'checked' }]">
            包含归档
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { Form } from 'ant-design-vue';
import { debounce } from 'lodash';
import { notes } from '@/store/modules/notes';
import { categories } from '@/store/modules/categories';
import { tags } from '@/store/modules/tags';
import { Note, Category, Tag } from '@/types';

interface SearchSuggestion {
  id: string;
  title: string;
  excerpt: string;
}

@Component({
  name: 'SearchBar',
})
export default class SearchBar extends Vue {
  searchKeyword = '';
  searching = false;
  showSuggestions = false;
  suggestions: SearchSuggestion[] = [];
  showAdvanced = false;
  form = this.$form.createForm(this);

  get categories(): Category[] {
    return categories.categoriesTree;
  }

  get tags(): Tag[] {
    return tags.allTags;
  }

  private debouncedSearch: any;

  created() {
    this.debouncedSearch = debounce(this.fetchSuggestions, 300);
  }

  handleInputChange() {
    if (this.searchKeyword.trim()) {
      this.debouncedSearch();
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  async fetchSuggestions() {
    if (!this.searchKeyword.trim()) return;

    this.searching = true;
    try {
      // 获取匹配的笔记
      const keyword = this.searchKeyword.toLowerCase();
      const allNotes = notes.notes;
      
      const matchedNotes = allNotes
        .filter(note => 
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
        )
        .slice(0, 5);

      this.suggestions = matchedNotes.map(note => ({
        id: note.id,
        title: note.title,
        excerpt: this.extractExcerpt(note.content, keyword),
      }));

      this.showSuggestions = this.suggestions.length > 0;
    } catch (error) {
      console.error('搜索建议失败:', error);
    } finally {
      this.searching = false;
    }
  }

  extractExcerpt(content: string, keyword: string): string {
    const index = content.toLowerCase().indexOf(keyword);
    if (index === -1) {
      return content.slice(0, 100) + '...';
    }

    const start = Math.max(0, index - 40);
    const end = Math.min(content.length, index + keyword.length + 40);
    let excerpt = content.slice(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  highlightKeyword(text: string): string {
    if (!this.searchKeyword) return text;

    const regex = new RegExp(`(${this.searchKeyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  selectSuggestion(suggestion: SearchSuggestion) {
    this.$router.push(`/notes/${suggestion.id}`);
    this.showSuggestions = false;
    this.searchKeyword = '';
  }

  handleSearch() {
    if (!this.searchKeyword.trim()) return;

    this.showSuggestions = false;
    notes.searchNotes(this.searchKeyword);
    
    if (this.$route.path !== '/notes') {
      this.$router.push('/notes');
    }
  }

  handleAdvancedSearch() {
    this.form.validateFields((err, values) => {
      if (!err) {
        const filter: any = {};
        
        if (values.keyword) filter.keyword = values.keyword;
        if (values.categoryId) filter.categoryId = values.categoryId;
        if (values.tags && values.tags.length) filter.tags = values.tags;
        if (values.isFavorite) filter.isFavorite = true;
        if (values.isArchived !== undefined) filter.isArchived = values.isArchived;
        
        if (values.dateRange && values.dateRange.length === 2) {
          filter.startDate = values.dateRange[0].toDate();
          filter.endDate = values.dateRange[1].toDate();
        }

        notes.SET_FILTER(filter);
        this.showAdvanced = false;
        
        if (this.$route.path !== '/notes') {
          this.$router.push('/notes');
        }
      }
    });
  }

  @Watch('$route')
  onRouteChange() {
    this.showSuggestions = false;
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  position: relative;
  width: 100%;

  ::v-deep .ant-input-search {
    .ant-input {
      border-radius: 20px;
      padding-left: 40px;
    }

    .ant-input-search-button {
      border-radius: 0 20px 20px 0;
    }
  }

  .search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;

    .suggestion-header {
      padding: 8px 16px;
      font-size: 12px;
      color: #8c8c8c;
      border-bottom: 1px solid #f0f0f0;
    }

    .suggestion-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f5f5;
      }

      .suggestion-icon {
        margin-right: 12px;
        margin-top: 2px;
        color: #8c8c8c;
      }

      .suggestion-content {
        flex: 1;
        overflow: hidden;

        .suggestion-title {
          font-weight: 500;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          ::v-deep mark {
            background-color: #ffe58f;
            padding: 0;
          }
        }

        .suggestion-text {
          font-size: 12px;
          color: #8c8c8c;
          line-height: 1.5;

          ::v-deep mark {
            background-color: #ffe58f;
            padding: 0;
          }
        }
      }
    }
  }
}
</style>
