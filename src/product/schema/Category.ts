import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Category {
  @Prop({required: true, unique: true})
  id: string;

  @Prop()
  title: string;

  @Prop()
  productCount: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);