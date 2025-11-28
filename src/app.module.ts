import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductModule } from "./product/product.module";
import { AuthModule } from "./auth/auth.module";
import { NotificationModule } from "./notification/notification.module";
import { OrderModule } from "./order/order.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_CONNECTION_STRING || ''
    ),
    ProductModule,
    AuthModule,
    NotificationModule,
    OrderModule,
  ],
})
export class AppModule { }
