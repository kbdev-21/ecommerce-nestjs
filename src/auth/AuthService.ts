import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/User';
import { Model } from 'mongoose';
import { CreateUserRequest } from './dto/CreateUserRequest';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createUser(createUserDto: CreateUserRequest): Promise<User> {
    const newUser = new this.userModel({
      id: crypto.randomUUID(),
      email: createUserDto.email,
      hashedPassword: "HASHED:" + createUserDto.password,
      name: createUserDto.name,
      addresses: createUserDto.addresses.map(addr => ({
        id: crypto.randomUUID(),
        name: addr.name,
        detail: addr.detail,
      })),
      createdAt: new Date(),
    });

    return newUser.save();
  }
}
