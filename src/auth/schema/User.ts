import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class User {
  @Prop({required: true, unique: true})
  id: string;

  @Prop({unique: true})
  email: string;

  @Prop()
  hashedPassword: string;

  @Prop({unique: true})
  phoneNum: string | null;

  @Prop()
  name: string;

  @Prop()
  role: "USER" | "ADMIN";

  @Prop()
  addresses: Address[];

  @Prop()
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

export class Address {
  id: string;
  name: string;
  detail: string;
}