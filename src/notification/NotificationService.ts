import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // tuỳ SMTP server bạn dùng
      port: 587,
      secure: false, // true nếu dùng port 465
      auth: {
        user: "doankimbang210703@gmail.com", // ví dụ: yourname@gmail.com
        pass: "nqwwqtvjzirjmeye", // app password, không phải mật khẩu thật
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

}