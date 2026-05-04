import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './infrastructure/logging/logger.config';
import { TransactionController } from './interfaces/controllers/transaction.controller';
import { TransactionService } from './application/services/transaction.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WinstonModule.forRoot(loggerConfig),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class AppModule {}
