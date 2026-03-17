import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '../../../modules/users/entities/user.entity';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AbstractPaginationDto } from '../../dto/abstract-pagination.dto';
import { resolveResponse } from '../../resolvers';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // @Post()
  // create(@Body() createNotificationDto: CreateNotificationDto) {
  //   return this.notificationsService.create(createNotificationDto);
  // }

  @Get()
  findAll(
    @Query() pagination: AbstractPaginationDto,
    @CurrentUser() user: User,
  ) {
    return resolveResponse(
      this.notificationsService.findAll(pagination, {
        where: {
          createdForId: user.id,
        },
      }),
    );
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.notificationsService.findOne(+id);
  // }

  @Patch(':id/mark-as-read')
  update(@Param('id') id: string, @CurrentUser() user: User) {
    return resolveResponse(this.notificationsService.markAsRead(id, user));
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.notificationsService.remove(+id);
  // }
}
