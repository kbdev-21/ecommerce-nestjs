import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/User';
import { AuthController } from './AuthController';
import { AuthService } from './AuthService';
import { JwtService } from './JwtService';
import { JwtAuthGuard } from './JwtAuthGuard';
import { ForgetPasswordRequest, ForgetPasswordRequestSchema } from './schema/ForgetPasswordRequest';
import { NotificationService } from '../notification/NotificationService';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {name: ForgetPasswordRequest.name, schema: ForgetPasswordRequestSchema}
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, NotificationService],
  exports: [AuthService, JwtAuthGuard]
})
export class AuthModule {}
