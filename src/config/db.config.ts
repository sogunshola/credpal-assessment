import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Helper } from '../shared/helpers';
import env from './env.config';

dotenv.config();

const scheme = Helper.getScheme();

export const typeOrmConfig: DataSourceOptions = {
  type: scheme,
  url: env.dbUrl,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: env.synchronize,
  logging: env.dbLogging,
  dropSchema: false,
  extra: env.typeormDriverExtra,
};

export const AppDataSource = new DataSource(typeOrmConfig);
