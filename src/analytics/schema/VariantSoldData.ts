import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class VariantSoldData {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({required: true, unique: true})
  code: string;

  @Prop()
  variantId: string;

  @Prop()
  dateRange: string;

  @Prop()
  count: number;

  @Prop()
  totalValue: number;
}