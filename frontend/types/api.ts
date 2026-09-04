export type ApiError = {
  detail: string;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};