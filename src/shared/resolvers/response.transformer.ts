import { ResponseDTO, PaginatedResponseDTO } from './response';

export function sendObjectResponse<T>(data: T, message: string): ResponseDTO<T> {
  return {
    status: true,
    message,
    data,
  };
}

export function sendPaginatedListResponse<T>(
  response: {
    list: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pageCount: number;
      skipped: number;
      nextPage: boolean;
    };
  },
  message: string,
): PaginatedResponseDTO<T> {
  return {
    status: true,
    message,
    data: response.list,
    pagination: response.pagination,
  };
}

export function sendListResponse<T>(data: T[], message: string) {
  return {
    status: true,
    message,
    data,
  };
}
