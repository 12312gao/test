import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import { Note, NoteFilter, NoteSortOptions, LoadingState } from '@/types';
import { db } from '@/db';
import store from '@/store';

@Module({ dynamic: true, store, name: 'notes', namespaced: true })
class NotesModule extends VuexModule {
  notes: Note[] = [];
  currentNote: Note | null = null;
  filter: NoteFilter = {};
  sortOptions: NoteSortOptions = {
    field: 'updatedAt',
    order: 'desc',
  };
  loadingState: LoadingState = 'idle';
  error: string = '';

  get filteredNotes(): Note[] {
    let filtered = [...this.notes];

    // 关键词过滤
    if (this.filter.keyword) {
      const keyword = this.filter.keyword.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword),
      );
    }

    // 分类过滤
    if (this.filter.categoryId) {
      filtered = filtered.filter((note) => note.categoryId === this.filter.categoryId);
    }

    // 标签过滤
    if (this.filter.tags && this.filter.tags.length > 0) {
      filtered = filtered.filter((note) =>
        this.filter.tags!.some((tag) => note.tags.includes(tag)),
      );
    }

    // 收藏过滤
    if (this.filter.isFavorite !== undefined) {
      filtered = filtered.filter((note) => note.isFavorite === this.filter.isFavorite);
    }

    // 归档过滤
    if (this.filter.isArchived !== undefined) {
      filtered = filtered.filter((note) => note.isArchived === this.filter.isArchived);
    }

    // 日期范围过滤
    if (this.filter.startDate) {
      filtered = filtered.filter((note) => note.createdAt >= this.filter.startDate!);
    }
    if (this.filter.endDate) {
      filtered = filtered.filter((note) => note.createdAt <= this.filter.endDate!);
    }

    // 排序
    filtered.sort((a, b) => {
      const field = this.sortOptions.field;
      const order = this.sortOptions.order === 'asc' ? 1 : -1;

      if (field === 'title') {
        return a.title.localeCompare(b.title) * order;
      } else if (field === 'viewCount') {
        return (a.viewCount - b.viewCount) * order;
      } else {
        const aTime = a[field].getTime();
        const bTime = b[field].getTime();
        return (aTime - bTime) * order;
      }
    });

    return filtered;
  }

  get totalNotes(): number {
    return this.notes.length;
  }

  get favoriteNotes(): Note[] {
    return this.notes.filter((note) => note.isFavorite);
  }

  @Mutation
  SET_NOTES(notes: Note[]) {
    this.notes = notes;
  }

  @Mutation
  SET_CURRENT_NOTE(note: Note | null) {
    this.currentNote = note;
  }

  @Mutation
  ADD_NOTE(note: Note) {
    this.notes.unshift(note);
  }

  @Mutation
  UPDATE_NOTE(updatedNote: Note) {
    const index = this.notes.findIndex((note) => note.id === updatedNote.id);
    if (index !== -1) {
      this.notes.splice(index, 1, updatedNote);
    }
  }

  @Mutation
  DELETE_NOTE(noteId: string) {
    const index = this.notes.findIndex((note) => note.id === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
    }
  }

  @Mutation
  SET_FILTER(filter: NoteFilter) {
    this.filter = { ...this.filter, ...filter };
  }

  @Mutation
  CLEAR_FILTER() {
    this.filter = {};
  }

  @Mutation
  SET_SORT_OPTIONS(options: NoteSortOptions) {
    this.sortOptions = options;
  }

  @Mutation
  SET_LOADING_STATE(state: LoadingState) {
    this.loadingState = state;
  }

  @Mutation
  SET_ERROR(error: string) {
    this.error = error;
  }

  @Action
  async fetchNotes() {
    this.SET_LOADING_STATE('loading');
    try {
      const notes = await db.notes.toArray();
      this.SET_NOTES(notes);
      this.SET_LOADING_STATE('success');
    } catch (error) {
      this.SET_ERROR(error.message);
      this.SET_LOADING_STATE('error');
    }
  }

  @Action
  async fetchNoteById(id: string) {
    try {
      const note = await db.notes.get(id);
      if (note) {
        this.SET_CURRENT_NOTE(note);
        // 增加阅读次数
        await db.notes.update(id, { viewCount: note.viewCount + 1 });
      }
    } catch (error) {
      this.SET_ERROR(error.message);
    }
  }

  @Action
  async createNote(noteData: Partial<Note>) {
    try {
      const newNote: Note = {
        id: `note_${Date.now()}`,
        title: noteData.title || '无标题笔记',
        content: noteData.content || '',
        categoryId: noteData.categoryId || '1',
        tags: noteData.tags || [],
        isMarkdown: noteData.isMarkdown || false,
        isFavorite: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        wordCount: noteData.content?.length || 0,
      };

      await db.notes.add(newNote);
      this.ADD_NOTE(newNote);

      // 更新标签计数
      for (const tag of newNote.tags) {
        await db.updateTagCount(tag, 1);
      }

      return newNote;
    } catch (error) {
      this.SET_ERROR(error.message);
      throw error;
    }
  }

  @Action
  async updateNote({ id, data }: { id: string; data: Partial<Note> }) {
    try {
      const note = await db.notes.get(id);
      if (!note) throw new Error('笔记不存在');

      const updatedNote = {
        ...note,
        ...data,
        updatedAt: new Date(),
        wordCount: data.content?.length || note.wordCount,
      };

      await db.notes.update(id, updatedNote);
      this.UPDATE_NOTE(updatedNote);

      // 更新标签计数
      const oldTags = note.tags;
      const newTags = updatedNote.tags;
      
      // 移除的标签
      for (const tag of oldTags) {
        if (!newTags.includes(tag)) {
          await db.updateTagCount(tag, -1);
        }
      }
      
      // 新增的标签
      for (const tag of newTags) {
        if (!oldTags.includes(tag)) {
          await db.updateTagCount(tag, 1);
        }
      }

      return updatedNote;
    } catch (error) {
      this.SET_ERROR(error.message);
      throw error;
    }
  }

  @Action
  async deleteNote(id: string) {
    try {
      const note = await db.notes.get(id);
      if (!note) throw new Error('笔记不存在');

      await db.notes.delete(id);
      this.DELETE_NOTE(id);

      // 更新标签计数
      for (const tag of note.tags) {
        await db.updateTagCount(tag, -1);
      }
    } catch (error) {
      this.SET_ERROR(error.message);
      throw error;
    }
  }

  @Action
  async toggleFavorite(id: string) {
    try {
      const note = await db.notes.get(id);
      if (!note) throw new Error('笔记不存在');

      const updatedNote = { ...note, isFavorite: !note.isFavorite };
      await db.notes.update(id, { isFavorite: updatedNote.isFavorite });
      this.UPDATE_NOTE(updatedNote);
    } catch (error) {
      this.SET_ERROR(error.message);
      throw error;
    }
  }

  @Action
  async toggleArchive(id: string) {
    try {
      const note = await db.notes.get(id);
      if (!note) throw new Error('笔记不存在');

      const updatedNote = { ...note, isArchived: !note.isArchived };
      await db.notes.update(id, { isArchived: updatedNote.isArchived });
      this.UPDATE_NOTE(updatedNote);
    } catch (error) {
      this.SET_ERROR(error.message);
      throw error;
    }
  }

  @Action
  async searchNotes(keyword: string) {
    this.SET_LOADING_STATE('loading');
    try {
      const results = await db.searchNotes(keyword);
      this.SET_NOTES(results);
      this.SET_FILTER({ keyword });
      this.SET_LOADING_STATE('success');
    } catch (error) {
      this.SET_ERROR(error.message);
      this.SET_LOADING_STATE('error');
    }
  }
}

export const notes = getModule(NotesModule);
