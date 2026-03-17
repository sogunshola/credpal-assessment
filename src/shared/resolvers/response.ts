import { ApiResponseProperty } from '@nestjs/swagger';

export class ResponseDTO<T> {
  @ApiResponseProperty()
  status: boolean;

  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: T;
}

export class PaginatedResponseDTO<T> {
  @ApiResponseProperty()
  status: boolean;

  @ApiResponseProperty()
  message: string;

  @ApiResponseProperty()
  data: T[];

  @ApiResponseProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
    skipped: number;
    nextPage: boolean;
  };
}
