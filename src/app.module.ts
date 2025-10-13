import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { OrderrModule } from './orderr/orderr.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://doankimbang210703_db_user:XQrchDtTvt0IE43i@cluster0.sagmog3.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0',
    ),
    ProductModule,
    AuthModule,
    NotificationModule,
    OrderModule,
  ],
})
export class AppModule {}