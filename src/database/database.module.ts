import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        console.log({
          type: 'postgres',
          port: config.get<number>('DATABASE_PORT', { infer: true }),
          username: config.get<string>('DATABASE_USER', { infer: true }),
          password: config.get<string>('DATABASE_PASSWORD', { infer: true }),
          database: config.get<string>('DATABASE_NAME', { infer: true }),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: true,
          synchronize: false,
          logging: false,
        });
        return {
          type: 'postgres',
          port: config.get<number>('DATABASE_PORT', { infer: true }),
          username: config.get<string>('DATABASE_USER', { infer: true }),
          password: config.get<string>('DATABASE_PASSWORD', { infer: true }),
          database: config.get<string>('DATABASE_NAME', { infer: true }),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: true,
          synchronize: false,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
