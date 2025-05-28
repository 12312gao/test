<template>
  <div class="note-editor">
    <div class="editor-toolbar">
      <a-radio-group v-model="editorMode" button-style="solid">
        <a-radio-button value="richtext">
          <a-icon type="edit" /> 富文本
        </a-radio-button>
        <a-radio-button value="markdown">
          <a-icon type="file-markdown" /> Markdown
        </a-radio-button>
      </a-radio-group>

      <div class="toolbar-actions">
        <a-tooltip title="插入图片">
          <a-button icon="picture" @click="insertImage" />
        </a-tooltip>
        <a-tooltip title="插入链接">
          <a-button icon="link" @click="insertLink" />
        </a-tooltip>
        <a-tooltip title="插入代码块">
          <a-button icon="code" @click="insertCode" />
        </a-tooltip>
        <a-divider type="vertical" />
        <a-tooltip title="预览">
          <a-button icon="eye" @click="togglePreview" />
        </a-tooltip>
        <a-tooltip title="全屏">
          <a-button icon="fullscreen" @click="toggleFullscreen" />
        </a-tooltip>
      </div>
    </div>

    <div class="editor-container" :class="{ 'split-view': showPreview }">
      <div class="editor-pane">
        <textarea
          ref="editor"
          v-model="content"
          class="editor-textarea"
          :placeholder="placeholder"
          @input="handleInput"
          @keydown="handleKeydown"
        />
      </div>
      
      <div v-if="showPreview" class="preview-pane">
        <div class="markdown-preview" v-html="renderedContent"></div>
      </div>
    </div>

    <div class="editor-footer">
      <div class="footer-info">
        <span>字数: {{ wordCount }}</span>
        <a-divider type="vertical" />
        <span>{{ saveStatus }}</span>
      </div>
      <div class="footer-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { debounce } from 'lodash';

// 配置marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error(err);
      }
    }
    return code;
  },
  breaks: true,
  gfm: true,
});

@Component
export default class NoteEditor extends Vue {
  @Prop({ default: '' }) value!: string;
  @Prop({ default: '请输入笔记内容...' }) placeholder!: string;
  @Prop({ default: 'markdown' }) defaultMode!: string;
  @Prop({ default: true }) autoSave!: boolean;
  @Prop({ default: 3000 }) autoSaveDelay!: number;

  content = '';
  editorMode = 'markdown';
  showPreview = false;
  isFullscreen = false;
  saveStatus = '已保存';
  wordCount = 0;

  private autoSaveTimer: any = null;
  private debouncedSave: any = null;

  get renderedContent() {
    if (this.editorMode === 'markdown') {
      return marked(this.content);
    }
    return this.content.replace(/\n/g, '<br>');
  }

  @Watch('value', { immediate: true })
  onValueChange(val: string) {
    if (val !== this.content) {
      this.content = val;
      this.updateWordCount();
    }
  }

  @Watch('content')
  onContentChange(val: string) {
    this.$emit('input', val);
    this.updateWordCount();
    
    if (this.autoSave) {
      this.saveStatus = '编辑中...';
      this.debouncedSave();
    }
  }

  created() {
    this.editorMode = this.defaultMode;
    this.debouncedSave = debounce(this.handleAutoSave, this.autoSaveDelay);
  }

  mounted() {
    this.setupEditor();
  }

  setupEditor() {
    const editor = this.$refs.editor as HTMLTextAreaElement;
    
    // 自动调整高度
    const adjustHeight = () => {
      editor.style.height = 'auto';
      editor.style.height = editor.scrollHeight + 'px';
    };
    
    editor.addEventListener('input', adjustHeight);
    adjustHeight();
  }

  handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.content = target.value;
  }

  handleKeydown(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    
    // Tab键处理
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      textarea.value = value.substring(0, start) + '  ' + value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      
      this.content = textarea.value;
    }
    
    // Ctrl+S 保存
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.save();
    }
  }

  updateWordCount() {
    // 移除Markdown语法后计算字数
    const plainText = this.content
      .replace(/[#*`~_\[\]()!]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    this.wordCount = plainText.length;
  }

  togglePreview() {
    this.showPreview = !this.showPreview;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.$emit('fullscreen', this.isFullscreen);
  }

  insertImage() {
    const url = prompt('请输入图片URL:');
    if (url) {
      this.insertText(`![图片描述](${url})`);
    }
  }

  insertLink() {
    const url = prompt('请输入链接URL:');
    if (url) {
      const text = prompt('请输入链接文本:') || 'Link';
      this.insertText(`[${text}](${url})`);
    }
  }

  insertCode() {
    const lang = prompt('请输入编程语言(可选):') || '';
    this.insertText(`\`\`\`${lang}\n代码\n\`\`\``);
  }

  insertText(text: string) {
    const textarea = this.$refs.editor as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    textarea.value = value.substring(0, start) + text + value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    
    this.content = textarea.value;
    textarea.focus();
  }

  handleAutoSave() {
    this.save();
  }

  @Emit('save')
  save() {
    this.saveStatus = '保存中...';
    setTimeout(() => {
      this.saveStatus = '已保存';
    }, 1000);
    return this.content;
  }

  beforeDestroy() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }
}
</script>

<style lang="scss" scoped>
.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;

  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e8e8e8;
    background: #fafafa;

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .editor-container {
    flex: 1;
    display: flex;
    overflow: hidden;

    &.split-view {
      .editor-pane,
      .preview-pane {
        width: 50%;
      }
    }

    .editor-pane {
      flex: 1;
      display: flex;
      flex-direction: column;

      .editor-textarea {
        flex: 1;
        width: 100%;
        padding: 16px;
        border: none;
        outline: none;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 14px;
        line-height: 1.6;
        resize: none;
        overflow-y: auto;

        &::placeholder {
          color: #bfbfbf;
        }
      }
    }

    .preview-pane {
      border-left: 1px solid #e8e8e8;
      overflow-y: auto;
      background: #fafafa;

      .markdown-preview {
        padding: 16px;
