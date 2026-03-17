import { Global, Module } from '@nestjs/common';
import { CacheService } from './modules/cache/cache.service';
import { DatabaseModule } from './database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [CacheService],
  exports: [CacheService, DatabaseModule],
})
export class GlobalModule {}
