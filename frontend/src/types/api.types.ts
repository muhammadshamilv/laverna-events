export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

// The shared backend envelope for any endpoint using StandardResultsPagination:
// `data` is the plain array of results, and pagination metadata is a SIBLING
// top-level key - NOT nested inside `data` (confirmed live against
// GET /api/events/; do not assume `data: { results: [...] }` here).
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}
