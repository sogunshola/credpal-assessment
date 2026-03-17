import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvents } from '../../../constants';
import { User } from '../../../modules/users/entities/user.entity';
import { BasicService } from '../../services/basic-service.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationsService extends BasicService<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepo: Repository<NotificationEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(notificationsRepo, 'Notification');
  }

  @OnEvent('notifications.create')
  async create(createNotificationDto: CreateNotificationDto) {
    const data = this.notificationsRepo.create(createNotificationDto);
    const notification = await this.notificationsRepo.save(data);
    this.eventEmitter.emit(AppEvents.SEND_NOTIFICATION, notification);
    return notification;
  }

  async markAsRead(id: string, user: User) {
    const notification = await this.notificationsRepo.findOne({
      where: {
        id,
        createdForId: user.id,
      },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.read) return notification;

    notification.read = true;

    await notification.save();

    return notification;
  }

  // findAll() {
  //   return
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} notification`;
  // }

  // update(id: number, updateNotificationDto: UpdateNotificationDto) {
  //   return `This action updates a #${id} notification`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} notification`;
  // }
}
