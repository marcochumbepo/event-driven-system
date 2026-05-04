import { Logger } from '@nestjs/common';

export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);

  constructor(
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 1000,
  ) {}

  async execute<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt}/${this.maxRetries} failed for ${context}: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.logger.error(`All ${this.maxRetries} attempts failed for ${context}`);
    throw lastError;
  }
}
