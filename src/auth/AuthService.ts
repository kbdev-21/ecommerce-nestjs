import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/User';
import { Model } from 'mongoose';
import { SignUpRequest } from './dto/SignUpRequest';
import { UserResponse } from './dto/UserResponse';
import { SignInRequest } from './dto/SignInRequest';
import { SignInResponse } from './dto/SignInResponse';
import { JwtService } from './JwtService';
import { ChangePasswordRequest } from './dto/ChangePasswordRequest';
import { UpdateUserRequestDto } from './dto/UpdateUserRequestDto';
import { ForgetPasswordRequest } from './schema/ForgetPasswordRequest';
import { NotificationService } from '../notification/NotificationService';
import { ConfirmForgetPasswordRequestDto } from './dto/ConfirmForgetPasswordRequestDto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ForgetPasswordRequest.name) private readonly forgetPwdModel: Model<ForgetPasswordRequest>,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly SALT_ROUNDS = 10;

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.userToResponse(user.toObject());
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.userModel.find();

    if (!users || users.length === 0) {
      throw new NotFoundException('No users found');
    }

    return users.map((user) => this.userToResponse(user.toObject()));
  }

  async updateUserById(userId: string, dto: UpdateUserRequestDto): Promise<UserResponse> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // cập nhật từng field nếu có trong dto
    if (dto.email) user.email = dto.email;
    if (dto.name) user.name = dto.name;
    if (dto.phoneNum) user.phoneNum = dto.phoneNum;

    if (dto.password) {
      user.hashedPassword = await this.hashPassword(dto.password);
    }

    if (dto.addresses && dto.addresses.length > 0) {
      // cập nhật logic addresses
      user.addresses = dto.addresses.map((addr) => {
        if (addr.id) {
          // nếu có id, update entry cũ
          const existing = user.addresses.find((a) => a.id === addr.id);
          if (existing) {
            existing.name = addr.name;
            existing.detail = addr.detail;
            return existing;
          }
        }

        // nếu không có id hoặc không khớp => thêm mới
        return {
          id: crypto.randomUUID(),
          name: addr.name,
          detail: addr.detail,
        };
      });
    }

    await user.save();

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
      isBanned: false
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

    // 🔒 Check if user is banned
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned');
    }

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

  async toggleBanUserById(id: string) {
    const user = await this.userModel.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    user.isBanned = !user.isBanned;
    await user.save();

    return {
        id: user.id,
        email: user.email,
        isBanned: user.isBanned,
    };
  }

  async initForgetPasswordRequest(userId: string): Promise<{ message: string; requestId: string }> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    if (!user.email) {
      throw new BadRequestException('User does not have a registered email');
    }

    // Hủy các yêu cầu cũ còn PENDING
    await this.forgetPwdModel.updateMany(
      { userId: user.id, status: 'PENDING' },
      { $set: { status: 'EXPIRED' } },
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const request = new this.forgetPwdModel({
      id: crypto.randomUUID(),
      userId: user.id,
      otpCode: otp,
      status: 'PENDING',
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await request.save();

    const htmlContent = `
    <h2>Yêu cầu đặt lại mật khẩu</h2>
    <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
    <p>Mã này sẽ hết hạn sau 5 phút.</p>
  `;

    await this.notificationService.sendEmail(user.email, 'Mã OTP đặt lại mật khẩu', htmlContent);

    return {
      message: 'OTP has been sent to your email',
      requestId: request.id, // 👈 thêm dòng này
    };
  }


  // =============================
  // 🔹 2. CONFIRM FORGET PASSWORD
  // =============================
  async confirmForgetPasswordRequest(
    dto: ConfirmForgetPasswordRequestDto,
  ): Promise<{ message: string }> {
    const request = await this.forgetPwdModel.findOne({
      id: dto.requestId,
      otpCode: dto.otp,
      status: 'PENDING',
    });

    if (!request) {
      throw new UnauthorizedException('Invalid request or OTP');
    }

    if (new Date() > request.expiredAt) {
      request.status = 'CANCELED';
      await request.save();
      throw new BadRequestException('OTP has expired');
    }

    const user = await this.userModel.findOne({ id: request.userId });
    if (!user) throw new NotFoundException('User not found');

    // Hash mật khẩu mới
    user.hashedPassword = await this.hashPassword(dto.newPassword);
    await user.save();

    // Đánh dấu hoàn tất request
    request.status = 'COMPLETED';
    await request.save();

    const htmlContent = `
    <h2>Đặt lại mật khẩu thành công</h2>
    <p>Tài khoản của bạn (${user.email}) đã được đặt lại mật khẩu thành công.</p>
    <p>Nếu bạn không thực hiện hành động này, hãy liên hệ ngay với bộ phận hỗ trợ.</p>
  `;
    await this.notificationService.sendEmail(user.email, 'Đặt lại mật khẩu thành công', htmlContent);

    return { message: 'Password has been reset successfully' };
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
    userResponse.isBanned = user.isBanned;

    // map addresses manually
    userResponse.addresses = (user.addresses || []).map(addr => ({
      id: addr.id,
      name: addr.name,
      detail: addr.detail,
    }));

    return userResponse;

  }
}
