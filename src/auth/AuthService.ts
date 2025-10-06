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

    return plainToInstance(UserResponse, user);
  }

  async signUp(request: SignUpRequest): Promise<SignInResponse> {
    // 1. Hash password
    const hashed = await this.hashPassword(request.password);

    // 2. Tạo user mới
    const newUser = new this.userModel({
      id: crypto.randomUUID(),
      email: request.email,
      phoneNum: null,
      hashedPassword: hashed,
      name: request.name,
      role: "USER",
      addresses: request.addresses.map(addr => ({
        id: crypto.randomUUID(),
        name: addr.name,
        detail: addr.detail,
      })),
      createdAt: new Date(),
    });

    // 3. Lưu vào DB
    const savedUser = await newUser.save();

    // 4. Tạo token ngay lập tức
    const token = this.jwtService.sign(savedUser.id, savedUser.role);

    return {
      user: plainToInstance(UserResponse, savedUser),
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
      user: plainToInstance(UserResponse, user),
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
}
