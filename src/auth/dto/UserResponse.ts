import { Expose, Type } from 'class-transformer';
import { Address } from '../schema/User';

export class UserResponse {
  @Expose()
  id: string;

  @Expose()
  email: string | null;

  @Expose()
  phoneNum: string | null;

  @Expose()
  name: string;

  @Expose()
  @Type(() => Address)
  addresses: Address[];

  @Expose()
  role: 'USER' | 'ADMIN';

  @Expose()
  createdAt: Date;
}
