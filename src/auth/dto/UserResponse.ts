import { Address } from '../schema/User';

export class UserResponse {
  id: string;
  email: string | null;
  phoneNum: string | null;
  name: string;
  addresses: Address[];
  role: "USER" | "ADMIN";
  createdAt: Date;
}