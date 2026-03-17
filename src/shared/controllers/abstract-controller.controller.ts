import { Body, Delete, Get, Param, Query } from '@nestjs/common';
import { AbstractPaginationDto } from '../dto/abstract-pagination.dto';
import { resolveResponse } from '../resolvers';

export abstract class AbstractController {
  service: any;

  create(@Body() payload: any) {
    return resolveResponse(
      this.service.create(payload),
      `${this.service.modelName} Created`,
    );
  }

  // @ApiResponse({ status: 200, type: AbstractResponse })
  @Get()
  findAll(@Query() pagination: AbstractPaginationDto) {
    return resolveResponse(this.service.findAll(pagination));
  }

  // @ApiResponse({ status: 200, type: AbstractResponse })
  @Get('/list/get')
  list() {
    return resolveResponse(this.service.list());
  }

  // @ApiResponse({ status: 200, type: AbstractResponse })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return resolveResponse(this.service.findOne(id));
  }

  // @ApiResponse({ status: 200, type: AbstractResponse })
  update(@Param('id') id: string, @Body() payload: any) {
    return resolveResponse(
      this.service.update(id, payload),
      `${this.service.modelName} Updated`,
    );
  }

  // @ApiResponse({ status: 200, type: AbstractResponse })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return resolveResponse(
      this.service.remove(id),
      `${this.service.modelName} Deleted`,
    );
  }
}
