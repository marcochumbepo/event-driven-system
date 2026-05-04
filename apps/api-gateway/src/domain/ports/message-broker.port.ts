export interface MessageBrokerPort {
  publish(exchange: string, routingKey: string, message: any): Promise<void>;
}
