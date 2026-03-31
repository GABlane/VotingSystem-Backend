import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Login required to vote');
    }
    if (user.role !== 'user') {
      throw new UnauthorizedException('User account required');
    }
    return user;
  }
}
