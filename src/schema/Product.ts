import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Product {
  @Prop()
  title: string;

  @Prop()
  normalizedTitle: string;

  @Prop()
  description: string;

  @Prop()
  imgUrls: string[];

  @Prop()
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
