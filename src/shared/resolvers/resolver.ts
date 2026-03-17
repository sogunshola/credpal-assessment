import { sendListResponse, sendObjectResponse, sendPaginatedListResponse } from './response.transformer';

interface PaginatedServiceReturnType<T> {
  list: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
    skipped: number;
    nextPage: boolean;
  };
}

export async function resolveResponse<T>(
  service: Promise<T[] | PaginatedServiceReturnType<T> | T>,
  message = 'Success',
) {
  const response = await service;

  if (Array.isArray(response)) {
    return sendListResponse<T>(response, message);
  }

  if (isPaginatedResponse<T>(response)) {
    return sendPaginatedListResponse<T>(response, message);
  }

  return sendObjectResponse<T>(response, message);
}

function isPaginatedResponse<T>(response: unknown): response is PaginatedServiceReturnType<T> {
  return typeof response === 'object' && 'list' in response && 'pagination' in response;
}
