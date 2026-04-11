export interface ApiErrorResponse {
  status: number;
  message: string;
  code: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SingleResponse<T> {
  data: T;
}
