/**
 * Generic, platform-agnostic types shared across apps.
 * Domain entities (Athlete, Event, Heat, Score, ...) intentionally do not
 * live here yet — they belong to their respective NestJS modules.
 */

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}
