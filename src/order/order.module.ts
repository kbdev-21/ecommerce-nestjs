import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './OrderController';
import { OrderService } from './OrderService';
import { Order, OrderSchema } from './schema/Order';
import { ProductService } from '../product/ProductService';
import { DiscountService } from './DiscountService';
import { DiscountController } from './DiscountController';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [OrderController, DiscountController],
  providers: [OrderService, ProductService, DiscountService],
  exports: [OrderService],
})
export class OrderModule {}