import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as crypto from 'crypto';

export type DiscountType = 'VND' | 'PERCENT';

@Schema({ collection: 'discounts' })
export class Discount {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true, enum: ['VND', 'PERCENT'] })
  type: DiscountType;

  @Prop({ required: true, min: 0 })
  discountValue: number;

  @Prop({ required: true })
  createdAt: Date;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);