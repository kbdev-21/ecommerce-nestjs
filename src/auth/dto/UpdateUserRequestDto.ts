import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsEmail,
    MinLength,
    ArrayNotEmpty,
    IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateUserRequestDto {
    @IsOptional()
    @IsEmail({}, { message: "Invalid email format" })
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(8, { message: "Password must be at least 8 characters" })
    password?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phoneNum?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateUserAddressDto)
    addresses?: UpdateUserAddressDto[];
}

export class UpdateUserAddressDto {
    @IsString()
    name: string;

    @IsString()
    detail: string;
}
