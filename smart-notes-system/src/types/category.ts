export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  isMarkdown: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  wordCount: number;
}

export interface NoteFilter {
  keyword?: string;
  categoryId?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface NoteSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'viewCount';
  order: 'asc' | 'desc';
}

export interface NoteStatistics {
  totalNotes: number;
  totalWords: number;
  totalCategories: number;
  totalTags: number;
  notesByCategory: Record<string, number>;
  notesByDate: Array<{
    date: string;
    count: number;
  }>;
  recentNotes: Note[];
}
