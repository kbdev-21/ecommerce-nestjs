import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsEmail, Length, MinLength,
} from 'class-validator';

export class SignUpRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  addresses: SignUpRequestAddress[];
}

export class SignUpRequestAddress {
  @IsString()
  name: string;

  @IsString()
  detail: string;
}