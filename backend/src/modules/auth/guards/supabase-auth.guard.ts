import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader)
      throw new UnauthorizedException('No authorization token provided');

    const token = authHeader.split(' ')[1];
    if (!token)
      throw new UnauthorizedException('Invalid authorization header format');

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user)
      throw new UnauthorizedException('Invalid or expired token');

    request['user'] = data.user;
    return true;
  }
}
