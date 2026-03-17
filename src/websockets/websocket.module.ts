import { Module } from '@nestjs/common';
import { ListenerGateway } from '.';

@Module({
  // imports: [SearchRequestsModule],
  providers: [ListenerGateway],
})
export class WebsocketModule {}
