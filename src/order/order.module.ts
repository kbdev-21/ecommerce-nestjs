import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './OrderController';
import { OrderService } from './OrderService';
import { Order, OrderSchema } from './schema/Order';
import { ProductModule } from '../product/product.module';
import { DiscountService } from './DiscountService';
import { DiscountController } from './DiscountController';
import { Discount, DiscountSchema } from './schema/Discount';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Discount.name, schema: DiscountSchema}
    ]),
    ProductModule, // Import ProductModule to use ProductService
  ],
  controllers: [OrderController, DiscountController],
  providers: [OrderService, DiscountService],
  exports: [OrderService],
})
export class OrderModule {}