import { Prop } from '@nestjs/mongoose';
import { Rating } from '../schema/Product';
import { Variant } from '../schema/Variant';

export class ProductResponse {
  id: string;
  title: string;
  normalizedTitle: string;
  description: string;
  category: string;
  brand: string;
  imgUrls: string[];
  variants: Variant[];
  ratings: Rating[];
  createdAt: Date;
}