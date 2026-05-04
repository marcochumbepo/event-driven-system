import * as amqp from 'amqplib';
import { MessageBrokerPort } from '../../domain/ports/message-broker.port';
import { RetryHandler } from './retry.handler';

export class RabbitMQAdapter implements MessageBrokerPort {
  private connection: any;
  private channel: any;
  private retryHandler: RetryHandler;
  private readonly concurrency: number = 5;

  constructor(private readonly url: string) {
    this.retryHandler = new RetryHandler();
  }

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
    
    // Setup prefetch for concurrency control
    await this.channel.prefetch(this.concurrency);
    
    // Setup DLQ
    await this.channel.assertQueue('transaction_queue_dlq', { durable: true });
  }

  async consume(queue: string, exchange: string, routingKey: string, handler: (message: any) => Promise<void>): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { 
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: 'transaction_queue_dlq'
    });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await this.retryHandler.execute(
            () => handler(content),
            `processing message ${msg.fields.deliveryTag}`
          );
          this.channel.ack(msg);
        } catch (error) {
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
