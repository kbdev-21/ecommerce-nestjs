import {
  IsString,
  IsEmail,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export class OrderItemInput {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderRequest {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNum: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}

export class UpdateOrderStatusRequest {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(["CART", "PENDING", "SHIPPING", "COMPLETED", "CANCELLED"])
  status: "CART" | "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
}

export class CalculateCartRequest {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNum: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];
}
