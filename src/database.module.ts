import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppDataSource } from './config/db.config';

@Module({
  imports: [],
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        await AppDataSource.initialize();
        return AppDataSource;
      },
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
