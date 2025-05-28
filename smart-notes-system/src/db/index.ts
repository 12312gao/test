import Dexie, { Table } from 'dexie';
import { DatabaseSchema, stores, schemaVersion } from './schemas';
import { Note, Category, Tag } from '@/types';

class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  categories!: Table<Category>;
  tags!: Table<Tag>;

  constructor() {
    super('SmartNotesDB');
    
    this.version(schemaVersion).stores(stores);
    
    // 初始化数据钩子
    this.on('ready', this.initialize.bind(this));
  }

  private async initialize() {
    // 检查是否需要初始化默认数据
    const noteCount = await this.notes.count();
    if (noteCount === 0) {
      await this.seedData();
    }
  }

  private async seedData() {
    // 创建默认分类
    const defaultCategories: Category[] = [
      {
        id: '1',
        name: '工作',
        parentId: null,
        color: '#1890ff',
        icon: 'laptop',
        description: '工作相关笔记',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '学习',
        parentId: null,
        color: '#52c41a',
        icon: 'book',
        description: '学习资料和笔记',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '生活',
        parentId: null,
        color: '#faad14',
        icon: 'home',
        description: '生活记录',
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await this.categories.bulkAdd(defaultCategories);

    // 创建示例笔记
    const sampleNote: Note = {
      id: '1',
      title: '欢迎使用智能笔记系统',
      content: '# 欢迎使用智能笔记系统\n\n这是一个功能强大的笔记管理工具。',
      categoryId: '2',
      tags: ['示例', '教程'],
      isMarkdown: true,
      isFavorite: true,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      wordCount: 20,
    };

    await this.notes.add(sampleNote);
  }

  // 笔记相关操作
  async searchNotes(keyword: string): Promise<Note[]> {
    const lowerKeyword = keyword.toLowerCase();
    return this.notes
      .filter((note) => {
        return (
          note.title.toLowerCase().includes(lowerKeyword) ||
          note.content.toLowerCase().includes(lowerKeyword)
        );
      })
      .toArray();
  }

  async getNotesByCategory(categoryId: string): Promise<Note[]> {
    return this.notes.where('categoryId').equals(categoryId).toArray();
  }

  async getNotesByTags(tags: string[]): Promise<Note[]> {
    return this.notes.where('tags').anyOf(tags).toArray();
  }

  // 标签相关操作
  async updateTagCount(tagName: string, delta: number) {
    const tag = await this.tags.where('name').equals(tagName).first();
    
    if (tag) {
      await this.tags.update(tag.id, { count: tag.count + delta });
    } else if (delta > 0) {
      // 创建新标签
      await this.tags.add({
        id: `tag_${Date.now()}`,
        name: tagName,
        color: this.getRandomColor(),
        count: delta,
        createdAt: new Date(),
      });
    }
  }

  private getRandomColor(): string {
    const colors = ['#f5222d', '#fa541c', '#fa8c16', '#faad14', '#52c41a', '#13c2c2', '#1890ff', '#722ed1'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const db = new NotesDatabase();
