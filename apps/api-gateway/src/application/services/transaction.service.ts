import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateTransactionDto } from '../../interfaces/dtos/create-transaction.dto';
import { RabbitMQAdapter } from '../../infrastructure/messaging/rabbitmq.adapter';

@Injectable()
export class TransactionService implements OnModuleInit {
  private readonly logger = new Logger(TransactionService.name);
  private messageBroker: RabbitMQAdapter;

  constructor() {
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
  }

  async createTransaction(dto: CreateTransactionDto): Promise<{ status: string; id: string }> {
    this.logger.log(`Processing transaction with idempotency key: ${dto.idempotencyKey}`);

    await this.messageBroker.publish('transactions', 'transaction.created', dto);
    this.logger.log(`Event published to RabbitMQ: ${JSON.stringify(dto)}`);

    return {
      status: 'accepted',
      id: dto.idempotencyKey,
    };
  }
}
