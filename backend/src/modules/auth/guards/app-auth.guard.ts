import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

type AppTokenPayload = {
  sub: string;
  email: string;
  role: string;
  status: string;
  token_type: 'access' | 'refresh';
};

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = String(request.headers.authorization || '').trim();
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      throw new UnauthorizedException('Missing authorization token.');
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured.');
    }

    try {
      const payload = jwt.verify(token, secret) as AppTokenPayload;
      if (payload.token_type !== 'access') {
        throw new UnauthorizedException('Invalid token type.');
      }
      request.authUser = payload;
      request.authToken = token;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session.');
    }
  }
}
