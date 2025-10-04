import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsEmail, Length,
} from 'class-validator';

export class CreateUserRequest {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8)
  password: string;

  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  addresses: CreateUserRequestAddress[];
}

export class CreateUserRequestAddress {
  @IsString()
  name: string;

  @IsString()
  detail: string;
}