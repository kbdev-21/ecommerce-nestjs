import { Module } from '@nestjs/common';
import { NotificationService } from './NotificationService';

@Module({
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}
