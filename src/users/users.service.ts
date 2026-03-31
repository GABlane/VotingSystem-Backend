import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.config';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(private jwtService: JwtService) {}

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

    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash })
      .select('id, email, votes_remaining, created_at')
      .single();

    if (error) {
      throw new InternalServerErrorException('Failed to create account');
    }

    const token = this.generateToken(data.id, data.email);

    return {
      user: {
        id: data.id,
        email: data.email,
        votes_remaining: data.votes_remaining,
      },
      access_token: token,
    };
  }

  async login(dto: LoginUserDto) {
    const { email, password } = dto;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, votes_remaining')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
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
      .select('id, email, votes_remaining, created_at')
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
    const payload: JwtPayload = {
      sub: userId,
      email,
      role: 'user',
    };
    return this.jwtService.sign(payload);
  }
}
