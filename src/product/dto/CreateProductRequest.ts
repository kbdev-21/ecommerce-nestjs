import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductRequest {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsString()
  brand: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imgUrls: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantRequest)
  variants: CreateVariantRequest[];
}

export class CreateVariantRequest {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;
}