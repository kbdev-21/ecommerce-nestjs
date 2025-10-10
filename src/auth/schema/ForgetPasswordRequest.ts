import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ForgetPasswordRequest {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({unique: true})
  userId: string;

  @Prop({required: false})
  newPassword?: string;

  @Prop()
  otpCode: string;

  @Prop()
  status: "PENDING" | "COMPLETED";

  @Prop()
  createdAt: Date;

  @Prop()
  expiredAt: Date;
}

export const ForgetPasswordRequestSchema = SchemaFactory.createForClass(ForgetPasswordRequest);