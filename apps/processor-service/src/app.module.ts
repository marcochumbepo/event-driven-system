import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorService } from './application/services/processor.service';
import { Transaction } from './domain/entities/transaction.entity';
import { TransactionRepository } from './infrastructure/database/transaction.repository';
import { redisCacheConfig } from './infrastructure/cache/redis.cache';
import { loggerConfig } from './infrastructure/logging/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WinstonModule.forRoot(loggerConfig),
    CacheModule.registerAsync({
      useFactory: () => redisCacheConfig,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Transaction],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Transaction]),
  ],
  controllers: [],
  providers: [ProcessorService, TransactionRepository],
})
export class AppModule {}
