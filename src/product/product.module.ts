import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './ProductController';
import { ProductService } from './ProductService';
import { Product, ProductSchema } from './schema/Product';
import { Variant, VariantSchema } from './schema/Variant';
import { Category, CategorySchema } from './schema/Category';
import { Brand, BrandSchema } from './schema/Brand';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Variant.name, schema: VariantSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}