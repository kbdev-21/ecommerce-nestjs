import { Expose, Type } from 'class-transformer';
import { Address } from '../schema/User';

export class UserResponse {
  id: string;
  email: string | null;
  phoneNum: string | null;
  name: string;
  @Type(() => Address)
  addresses: Address[];
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  isBanned: boolean;
}
