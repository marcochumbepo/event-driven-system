import * as amqp from 'amqplib';
import { MessageBrokerPort } from '../../domain/ports/message-broker.port';

export class RabbitMQAdapter implements MessageBrokerPort {
  private connection: any;
  private channel: any;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
  }

  async consume(queue: string, exchange: string, routingKey: string, handler: (message: any) => Promise<void>): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    this.channel.consume(queue, async (msg: any) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel.ack(msg);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
