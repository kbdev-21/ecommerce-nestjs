import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Brand {
  @Prop({required: true, unique: true})
  id: string;

  @Prop()
  title: string;

  @Prop()
  productCount: number;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);