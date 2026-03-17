import { NotificationTypes } from '../enum/notification-types.enum';

export class CreateNotificationDto {
  createdById: string;

  createdForId: string;

  recordId: string;

  metaData: Record<string, any>;

  type: NotificationTypes;
}
