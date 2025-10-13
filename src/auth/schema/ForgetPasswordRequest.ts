import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class ForgetPasswordRequest {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({required: true})
  userId: string;

  @Prop()
  otpCode: string;

  @Prop()
  status: "PENDING" | "COMPLETED" | "CANCELED";

  @Prop()
  createdAt: Date;

  @Prop()
  expiredAt: Date;
}

export const ForgetPasswordRequestSchema = SchemaFactory.createForClass(ForgetPasswordRequest);