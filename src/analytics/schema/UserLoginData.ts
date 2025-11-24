import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class UserLoginData {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({required: true, unique: true})
  code: string;

  @Prop()
  userId: string;

  @Prop()
  dateRange: string;

  @Prop()
  count: number;
}