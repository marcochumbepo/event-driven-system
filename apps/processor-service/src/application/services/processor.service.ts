import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RabbitMQAdapter } from '../../infrastructure/messaging/rabbitmq.adapter';
import { TransactionRepository } from '../../infrastructure/database/transaction.repository';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class ProcessorService implements OnModuleInit {
  private readonly logger = new Logger(ProcessorService.name);
  private messageBroker: RabbitMQAdapter;

  constructor(
    private readonly transactionRepository: TransactionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.messageBroker = new RabbitMQAdapter(process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672');
  }

  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.messageBroker.connect();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        this.logger.warn(`Failed to connect to RabbitMQ, retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    await this.messageBroker.consume(
      'transaction_queue',
      'transactions',
      'transaction.created',
      async (message) => {
        this.logger.log(`Processing transaction: ${JSON.stringify(message)}`);
        
        // Check idempotency
        const cached = await this.cacheManager.get(`transaction:${message.idempotencyKey}`);
        if (cached) {
          this.logger.log(`Transaction with idempotency key ${message.idempotencyKey} found in cache. Skipping.`);
          return;
        }

        const existing = await this.transactionRepository.findByIdempotencyKey(message.idempotencyKey);
        if (existing) {
          this.logger.log(`Transaction with idempotency key ${message.idempotencyKey} already processed. Skipping.`);
          await this.cacheManager.set(`transaction:${message.idempotencyKey}`, existing);
          return;
        }
        
        const transaction = new Transaction();
        transaction.idempotencyKey = message.idempotencyKey;
        transaction.type = message.type;
        transaction.amount = message.amount;
        transaction.userId = message.userId;
        transaction.status = 'processed';
        
        await this.transactionRepository.save(transaction);
        await this.cacheManager.set(`transaction:${message.idempotencyKey}`, transaction);
        this.logger.log(`Transaction saved to database with idempotency key: ${message.idempotencyKey}`);
        
        // Publish event to notification service
        await this.messageBroker.publish('transactions', 'transaction.processed', {
          idempotencyKey: message.idempotencyKey,
          userId: message.userId,
          status: 'processed'
        });
      }
    );
    this.logger.log('Consumer started - listening for transactions');
  }
}
