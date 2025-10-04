import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  Min, IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVariantRequest } from './CreateProductRequest';

export class UpdateProductRequest {
  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  brand?: string;

  @IsOptional()
  status?: "PUBLISHED" | "ARCHIVED";

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imgUrls?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantRequest)
  variants?: CreateVariantRequest[];
}