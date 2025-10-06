import { UserResponse } from './UserResponse';

export class SignInResponse {
  user: UserResponse;
  token: string;
}