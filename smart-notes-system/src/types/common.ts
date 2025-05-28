export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Theme {
  name: string;
  primaryColor: string;
  isDark: boolean;
}

export interface UserPreferences {
  theme: Theme;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultView: 'list' | 'card' | 'timeline';
  editorMode: 'markdown' | 'richtext';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}
