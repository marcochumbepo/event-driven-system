import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../domain/entities/transaction.entity';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { idempotencyKey } });
  }
}
