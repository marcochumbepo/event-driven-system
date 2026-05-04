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

  async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
