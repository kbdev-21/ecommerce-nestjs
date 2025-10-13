import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmForgetPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}