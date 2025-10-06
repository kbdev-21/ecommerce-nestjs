// dto/ChangePasswordRequest.ts
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordRequest {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  newPassword: string;
}
