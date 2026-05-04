import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryColumn()
  idempotencyKey: string;

  @Column()
  type: string;

  @Column('decimal')
  amount: number;

  @Column()
  userId: string;

  @Column({ default: 'processed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
