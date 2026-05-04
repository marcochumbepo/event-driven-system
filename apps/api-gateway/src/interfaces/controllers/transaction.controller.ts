import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { TransactionService } from '../../application/services/transaction.service';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @HttpCode(202)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.createTransaction(createTransactionDto);
  }
}
