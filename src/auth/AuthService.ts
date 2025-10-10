import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/User';
import { Model } from 'mongoose';
import { SignUpRequest } from './dto/SignUpRequest';
import { UserResponse } from './dto/UserResponse';
import { plainToInstance } from 'class-transformer';
import { SignInRequest } from './dto/SignInRequest';
import { SignInResponse } from './dto/SignInResponse';
import { JwtService } from './JwtService';
import { ChangePasswordRequest } from './dto/ChangePasswordRequest';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  private readonly SALT_ROUNDS = 10;

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.userToResponse(user.toObject());
  }

  async signUp(request: SignUpRequest): Promise<SignInResponse> {
    const hashed = await this.hashPassword(request.password);

    const newUser = new this.userModel({
      id: crypto.randomUUID(),
      email: request.email,
      phoneNum: null,
      hashedPassword: hashed,
      name: request.name,
      role: 'USER',
      addresses: request.addresses.map((addr) => ({
        id: crypto.randomUUID(),
        name: addr.name,
        detail: addr.detail,
      })),
      createdAt: new Date(),
    });

    const savedUser = await newUser.save();

    const token = this.jwtService.sign(savedUser.id, savedUser.role);

    return {
      user: this.userToResponse(savedUser.toObject()),
      token,
    };
  }

  async signInWithEmailAndPassword(request: SignInRequest): Promise<SignInResponse> {
    const user = await this.userModel.findOne({ email: request.email });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isValid = await this.comparePassword(request.password, user.hashedPassword);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    const token = this.jwtService.sign(user.id, user.role);

    return {
      user: this.userToResponse(user.toObject()),
      token,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordRequest): Promise<void> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await this.comparePassword(dto.oldPassword, user.hashedPassword);
    if (!isValid) throw new UnauthorizedException('Old password is incorrect');

    user.hashedPassword = await this.hashPassword(dto.newPassword);

    await user.save();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async comparePassword(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }

  private userToResponse(user: User): UserResponse {
    const userResponse = new UserResponse();

    userResponse.id = user.id;
    userResponse.email = user.email ?? null;
    userResponse.phoneNum = user.phoneNum ?? null;
    userResponse.name = user.name;
    userResponse.role = user.role;
    userResponse.createdAt = user.createdAt;

    // map addresses manually
    userResponse.addresses = (user.addresses || []).map(addr => ({
      id: addr.id,
      name: addr.name,
      detail: addr.detail,
    }));

    return userResponse;

  }
}
