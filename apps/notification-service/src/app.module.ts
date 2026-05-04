import { Module } from '@nestjs/common';
import { NotificationService } from './application/services/notification.service';

@Module({
  imports: [],
  controllers: [],
  providers: [NotificationService],
})
export class AppModule {}
