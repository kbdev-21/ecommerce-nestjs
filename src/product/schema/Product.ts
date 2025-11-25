import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export class Variant {
    id: string;
    name: string;
    price: number;
    stock: number;
    sold: number;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);

@Schema()
export class Product {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ unique: true })
    title: string;

    @Prop({ unique: true })
    normalizedTitle: string;

    @Prop({ unique: true })
    slug: string;

    @Prop()
    description: string;

    @Prop()
    category: string;

    @Prop()
    brand: string;

    @Prop()
    imgUrls: string[];

    @Prop({ type: Array, default: [] })
    variants: Variant[];

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
