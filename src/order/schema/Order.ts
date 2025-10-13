import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Order {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop()
  userId?: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneNum: string;

  @Prop()
  discountCode?: string;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  status: "CART" | "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ type: Array, default: [] })
  lines: Line[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export class Line {
  productId: string;
  variantId: string;
  displayName: string;
  imgUrl: string;
  quantity: number;
  price: number;
}