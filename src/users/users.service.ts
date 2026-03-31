import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { supabase } from '../config/supabase.config';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { EmailService } from './email.service';

@Injectable()
export class UsersService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterUserDto) {
    const { email, password } = dto;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        verification_token: verificationToken,
        verification_token_expires_at: expiresAt,
      })
      .select('id, email')
      .single();

    if (error) {
      throw new InternalServerErrorException('Failed to create account');
    }

    await this.emailService.sendVerificationEmail(data.email, verificationToken);

    return {
      message: 'Account created. Please check your email to verify your account before logging in.',
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, verification_token_expires_at, email_verified')
      .eq('verification_token', token)
      .single();

    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    if (user.email_verified) {
      return { message: 'Email already verified. You can log in.' };
    }

    const isExpired = new Date(user.verification_token_expires_at) < new Date();
    if (isExpired) {
      throw new BadRequestException('Verification link has expired. Please register again.');
    }

    const { error } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq('id', user.id);

    if (error) {
      throw new InternalServerErrorException('Failed to verify email');
    }

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(dto: LoginUserDto) {
    const { email, password } = dto;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, votes_remaining, email_verified')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        votes_remaining: user.votes_remaining,
      },
      access_token: token,
    };
  }

  async getMe(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, votes_remaining')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: data.id,
      email: data.email,
      votes_remaining: data.votes_remaining,
    };
  }

  async decrementVotes(userId: string): Promise<void> {
    const { data: user } = await supabase
      .from('users')
      .select('votes_remaining')
      .eq('id', userId)
      .single();

    if (!user || user.votes_remaining <= 0) {
      throw new ForbiddenException('No votes remaining');
    }

    const { error } = await supabase
      .from('users')
      .update({ votes_remaining: user.votes_remaining - 1 })
      .eq('id', userId);

    if (error) {
      throw new InternalServerErrorException('Failed to update vote count');
    }
  }

  private generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email, role: 'user' };
    return this.jwtService.sign(payload);
  }
}
