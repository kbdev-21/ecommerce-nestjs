import { Body, Controller, Post, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './AuthService';
import { SignUpRequest } from './dto/SignUpRequest';
import { SignInRequest } from './dto/SignInRequest';
import { SignInResponse } from './dto/SignInResponse';
import { UserResponse } from './dto/UserResponse';
import { JwtAuthGuard } from './JwtAuthGuard';
import { JwtPayload } from './JwtService';
import { ChangePasswordRequest } from './dto/ChangePasswordRequest';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/api/auth/signup')
  async signUp(@Body() dto: SignUpRequest): Promise<SignInResponse> {
    return this.authService.signUp(dto);
  }

  @Post('/api/auth/signin')
  async signIn(@Body() dto: SignInRequest): Promise<SignInResponse> {
    return this.authService.signInWithEmailAndPassword(dto);
  }

  @Get('/api/auth/me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request & { user: JwtPayload }): Promise<UserResponse> {
    const userId = req.user.sub;
    return this.authService.getUserById(userId);
  }

  @Post('/api/auth/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: ChangePasswordRequest,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(req.user.sub, dto);
    return { message: 'Password changed successfully' };
  }
}
