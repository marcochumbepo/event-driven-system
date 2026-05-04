import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQAdapter } from '../../infrastructure/messaging/rabbitmq.adapter';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
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

    await this.messageBroker.consume(
      'notification_queue',
      'transactions',
      'transaction.processed',
      async (message) => {
        this.logger.log(`Notification sent to user ${message.userId}: Transaction ${message.idempotencyKey} processed successfully`);
      }
    );
    this.logger.log('Notification service started - listening for processed transactions');
  }
}
