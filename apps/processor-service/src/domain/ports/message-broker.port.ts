export interface MessageBrokerPort {
  consume(queue: string, exchange: string, routingKey: string, handler: (message: any) => Promise<void>): Promise<void>;
}
