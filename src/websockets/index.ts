import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from '../constants/events';
import { NotificationEntity } from '../shared/alerts/notifications/entities/notification.entity';
import env from '../config/env.config';

@WebSocketGateway({
  cors: {},
})
export class ListenerGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  // constructor(private firebaseMessageService: FirebaseMessagingService) {}

  @WebSocketServer()
  server: Server;

  connectedUsers: string[] = [];

  @OnEvent(AppEvents.SEND_NOTIFICATION)
  handleNotification(notification: NotificationEntity) {
    const { createdForId } = notification;

    // this.sendNotification(createdForId, notification, 'notification');
  }

  async handleConnection(socket: Socket) {
    try {
      const response = await this.validate(socket);
      const { id } = response;
      socket.join(id);
      this.connectedUsers = [...this.connectedUsers, id];
      const onlineUsers = [...new Set(this.connectedUsers)];
      this.connectedUsers = onlineUsers;
      console.log('connected users', this.connectedUsers);
      this.server.emit('online-users', this.connectedUsers);
    } catch (error) {
      console.log('connection error', error);
    }
  }

  async handleDisconnect(socket) {
    try {
      const response = await this.validate(socket);
      const { id } = response;
      socket.leave(id);
      const userExist = this.connectedUsers.indexOf(id);

      if (userExist > -1) {
        this.connectedUsers = [
          ...this.connectedUsers.slice(0, userExist),
          ...this.connectedUsers.slice(userExist + 1),
        ];
      }
      const onlineUsers = [...new Set(this.connectedUsers)];
      this.connectedUsers = onlineUsers;

      console.log('connected users', this.connectedUsers);
      this.server.emit('online-users', this.connectedUsers);
    } catch (error) {}
  }

  async validate(socket: Socket): Promise<Record<string, any>> {
    const token: any = socket.handshake.query.token;
    console.log('connection request from user with token', token);
    if (!token) throw new WsException('Unauthorized');
    const tokendata: any = verify(token, env.jwtSecret);
    return tokendata;
  }

  // async sendNotification(userId: string, notification: NotificationEntity, eventId: string) {
  //   const user = await getRepository(User).findOne({ where: { id: userId } });

  //   if (user.setting.pushNotifications == false) return;

  //   if (this.connectedUsers.indexOf(user.id) != -1) {
  //     console.log(`sending to ${user.username} using socket `);
  //     this.server.to(userId).emit('notification', notification);
  //     return;
  //   }

  //   console.log(`sending to ${user.username} using ${user.fcmToken} `);

  //   try {
  //     await this.firebaseMessageService.sendToDevice([user.fcmToken], {
  //       data: {
  //         body: JSON.stringify(notification),
  //       },
  //     });
  //   } catch (error) {
  //     console.log(`failed to send notification to ${user.username}`);
  //   }
  // }
}
