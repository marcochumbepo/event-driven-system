import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  idempotencyKey: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  userId: string;
}
