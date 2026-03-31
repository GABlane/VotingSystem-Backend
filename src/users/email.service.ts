import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined in environment variables');
    }
    this.resend = new Resend(apiKey);
    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com';
    const fromName =
      this.configService.get<string>('RESEND_FROM_NAME') || 'Voting';
    this.fromEmail = `${fromName} <${fromEmail}>`;
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Verify your email to start voting',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="margin-bottom: 8px;">Confirm your email</h2>
          <p style="color: #666; margin-bottom: 24px;">
            Click the button below to verify your email address and activate your account.
            This link expires in 24 hours.
          </p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #000; color: #fff; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            Verify Email
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            If you did not create an account, you can ignore this email.
          </p>
          <p style="color: #999; font-size: 12px;">
            Or copy this link: ${verifyUrl}
          </p>
        </div>
      `,
    });

    if (error) {
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
