import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Variant {
  @Prop({required: true, unique: true})
  id: string;

  @Prop()
  productId: string;

  @Prop()
  name: string;

  @Prop()
  price: number;

  @Prop()
  stock: number;

  @Prop()
  sold: number;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);