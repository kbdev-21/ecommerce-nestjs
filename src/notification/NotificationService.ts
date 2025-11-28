import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class NotificationService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            port: 587,
            secure: false, 
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD, 
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        await this.transporter.sendMail({
            from: `"TDT GEAR"`,
            to,
            subject,
            html,
        });
    }
}
