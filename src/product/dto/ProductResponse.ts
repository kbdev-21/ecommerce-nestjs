import { Rating, Variant } from "../schema/Product";

export class ProductResponse {
    id: string;
    title: string;
    normalizedTitle: string;
    slug: string;
    description: string;
    category: string;
    brand: string;
    imgUrls: string[];
    variants: Variant[];
    ratings: Rating[];
    createdAt: Date;
}
