import { Note, Category, Tag } from '@/types';

export interface DatabaseSchema {
  notes: Note;
  categories: Category;
  tags: Tag;
}

export const schemaVersion = 1;

export const stores = {
  notes: 'id, title, categoryId, *tags, createdAt, updatedAt, isFavorite, isArchived',
  categories: 'id, name, parentId, order',
  tags: 'id, name, count',
};
