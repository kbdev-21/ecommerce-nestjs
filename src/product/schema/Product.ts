import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Product {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({unique: true})
  title: string;

  @Prop({unique: true})
  normalizedTitle: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop()
  brand: string;

  @Prop()
  imgUrls: string[];

  @Prop()
  status: "PUBLISHED" | "ARCHIVED";

  @Prop()
  variantIds: string[];

  @Prop()
  ratings: Rating[];

  @Prop()
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export class Rating {
  id: string;
  userId: string;
  userName: string;
  score: number;
  comment: string;
  createdAt: Date;
}