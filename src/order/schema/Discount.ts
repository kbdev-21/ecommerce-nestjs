import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ collection: "discounts" })
export class Discount {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true, unique: true, trim: true })
    code: string;

    @Prop({ required: true, min: 0 })
    discountValue: number;

    @Prop({ required: true, default: 0 })
    usageCount: number;

    @Prop({ required: true })
    usageLimit: number;

    @Prop({ required: true })
    createdAt: Date;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);
