import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({unique: true})
  email: string;

  @Prop()
  hashedPassword: string;

  @Prop({required: false})
  phoneNum?: string;

  @Prop()
  name: string;

  @Prop()
  role: "USER" | "ADMIN";

  @Prop()
  addresses: Address[];

  @Prop()
  createdAt: Date;

  @Prop()
  isBanned: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

export class Address {
  name: string;
  detail: string;
}