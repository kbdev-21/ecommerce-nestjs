import { Prop } from '@nestjs/mongoose';

export class CreateProductRequest {
  title: string;

  normalizedTitle: string;

  description: string;

  imgUrls: string[];

  createdAt: Date;
}