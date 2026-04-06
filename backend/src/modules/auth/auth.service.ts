import {
  Injectable,
  Inject,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
} from '../../database/supabase.module';
import { RegisterProviderDto } from './dto/create-provider.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRepository } from '../users/repositories/user.repository';
import { handleSupabaseError } from '../../common/utils/supabase-error.handler';
import 'multer';
import {
  User,
  ProviderProfile,
} from '../../common/interfaces/database.interfaces';
import jwt from 'jsonwebtoken';

type AuthUserRecord = Pick<
  User,
  'id' | 'email' | 'full_name' | 'contact_number' | 'role' | 'status'
>;

type SessionBundle = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    user_metadata: Record<string, string>;
    app_metadata: Record<string, string>;
  };
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabase: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    private readonly userRepository: UserRepository,
  ) {}

  async register(dto: Partial<User> & { password?: string; address?: string }) {
    try {
      if (!dto.email || !dto.password) {
        throw new BadRequestException('Email and password are required.');
      }

      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email: dto.email,
          password: dto.password,
        });

      if (authError) throw new Error(`Auth Error: ${authError.message}`);
      if (!authData.user)
        throw new InternalServerErrorException('Auth signup returned no user.');
      const userId = authData.user.id;

      await this.userRepository.create({
        id: userId,
        role: dto.role || 'customer',
        full_name: dto.full_name,
        email: dto.email,
        contact_number: dto.contact_number,
      });

      const { error: profileError } = await this.identityDb
        .from('customer_profiles')
        .insert([{ user_id: userId, address: dto.address }]);

      if (profileError)
        throw new Error(`Profile Table Error: ${profileError.message}`);

      const user = await this.requireUserRecord(userId);

      return {
        status: 201,
        message: 'Registration Successful.',
        userId,
        session: this.buildSessionBundle(user),
      };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async login(loginDto: LoginUserDto) {
    try {
      const identifier = loginDto.identifier;
      const isEmail = identifier.includes('@');
      let loginEmail = identifier;

      if (!isEmail) {
        const userRecord =
          await this.userRepository.findByContactNumber(identifier);
        if (!userRecord)
          throw new UnauthorizedException('Phone number not registered.');
        loginEmail = userRecord.email;
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginDto.password,
      });

      if (error) throw new UnauthorizedException('Invalid Credentials');

      const userId = data.user?.id;
      if (!userId) throw new UnauthorizedException('Authentication failed.');

      const userData = await this.userRepository.findById<
        Pick<User, 'role' | 'status'>
      >(userId, 'role, status');

      if (!userData) throw new NotFoundException('User profile not found.');

      if (
        userData.role === 'provider' &&
        (userData.status === 'pending' || userData.status === 'rejected')
      ) {
        await this.supabase.auth.signOut();
        throw new UnauthorizedException({
          message: 'Access Denied: Provider account is not yet active.',
          current_status: userData.status,
        });
      }

      const sessionUser = await this.requireUserRecord(userId);

      return {
        message: 'STATUS 200 OK',
        ...this.buildSessionBundle(sessionUser),
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(err.response || err.message);
    }
  }

  async registerProvider(dto: RegisterProviderDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('document_file image is required');

    const {
      full_name,
      email,
      contact_number,
      password,
      role,
      business_name,
      document_type,
      date_of_birth,
    } = dto;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must be 8-128 chars with uppercase, lowercase, number, and special character.',
      );
    }

    const { data: authData, error: authError } =
      await this.supabase.auth.signUp({ email, password });
    if (authError)
      throw new BadRequestException(
        `Auth Registration Error: ${authError.message}`,
      );

    const newUserId = authData.user?.id;
    if (!newUserId)
      throw new BadRequestException('Could not retrieve user ID from Supabase');

    try {
      const { error: updateError } = await this.identityDb
        .from('users')
        .update({
          full_name,
          contact_number,
          role: role as 'customer' | 'provider',
          date_of_birth,
          status: 'pending',
        })
        .eq('id', newUserId);

      if (updateError) handleSupabaseError(updateError, 'UserUpdate');
    } catch (userError) {
      await this.supabase.auth.admin.deleteUser(newUserId);
      throw new BadRequestException(`User Profile Error: ${userError.message}`);
    }

    const profileResponse = await this.catalogDb
      .from('provider_profiles')
      .insert([
        { user_id: newUserId, business_name, verification_status: 'pending' },
      ])
      .select('id, business_name, verification_status')
      .single();

    const profile = profileResponse.data as Pick<
      ProviderProfile,
      'id' | 'business_name' | 'verification_status'
    > | null;
    const profileError = profileResponse.error;

    if (profileError) handleSupabaseError(profileError, 'ProviderProfile');

    const filePath = `kyc/${newUserId}/${Date.now()}_${file.originalname}`;
    const { error: uploadError } = await this.supabase.storage
      .from('verification-docs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError)
      throw new BadRequestException(
        `Storage Upload Error: ${uploadError.message}`,
      );

    const { error: docError } = await this.catalogDb
      .from('provider_documents')
      .insert([
        {
          provider_id: newUserId,
          document_type,
          document_file_path: filePath,
          status: 'pending',
        },
      ]);

    if (docError) handleSupabaseError(docError, 'ProviderDocument');

    return {
      message: 'Provider application submitted. Pending approval.',
      data: {
        provider_id: newUserId,
        business_name: profile?.business_name,
        verification_status: profile?.verification_status,
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyToken(refreshToken, 'refresh');
    const user = await this.requireUserRecord(payload.sub);
    return this.buildSessionBundle(user);
  }

  async logout() {
    return { ok: true };
  }

  async getMe(userId: string) {
    const user = await this.requireUserRecord(userId);
    return { user: this.mapUser(user) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const redirectTo =
      dto.redirect_to?.trim() ||
      this.configService.get<string>('PASSWORD_RESET_REDIRECT_URL');

    const { error } = await this.supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      redirectTo ? { redirectTo } : undefined,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'If the account exists, a password reset email has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.resolvePasswordResetUserId(dto);

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: dto.password.trim(),
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password updated successfully.' };
  }

  private async resolvePasswordResetUserId(
    dto: ResetPasswordDto,
  ): Promise<string> {
    if (dto.access_token) {
      const { data, error } = await this.supabase.auth.getUser(
        dto.access_token,
      );
      if (error || !data.user?.id) {
        throw new BadRequestException('Invalid password reset token.');
      }
      return data.user.id;
    }

    if (dto.code) {
      const response = await this.supabase.auth.exchangeCodeForSession(
        dto.code,
      );
      const userId = response.data.user?.id;
      if (!userId) {
        throw new BadRequestException('Invalid recovery code.');
      }
      return userId;
    }

    if (dto.token_hash) {
      const response = await this.supabase.auth.verifyOtp({
        token_hash: dto.token_hash,
        type: (dto.type as 'recovery' | undefined) || 'recovery',
      });
      const userId = response.data.user?.id;
      if (!userId) {
        throw new BadRequestException('Invalid recovery token.');
      }
      return userId;
    }

    throw new BadRequestException('A password reset token is required.');
  }

  private buildSessionBundle(user: AuthUserRecord): SessionBundle {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT secret is not configured.');
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        token_type: 'access',
      },
      secret,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        status: user.status || 'active',
        token_type: 'refresh',
      },
      secret,
      { expiresIn: '30d' },
    );

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user: this.mapUser(user),
      role: user.role,
    };
  }

  private mapUser(user: AuthUserRecord): SessionBundle['user'] {
    const metadata = {
      full_name: String(user.full_name || ''),
      phone: String(user.contact_number || ''),
      role: String(user.role || ''),
    };

    return {
      id: user.id,
      email: String(user.email || ''),
      role: String(user.role || ''),
      status: String(user.status || 'active'),
      user_metadata: metadata,
      app_metadata: {
        role: String(user.role || ''),
      },
    };
  }

  private verifyToken(token: string, expectedType: 'access' | 'refresh') {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret is not configured.');
    }

    try {
      const payload = jwt.verify(token, secret) as {
        sub: string;
        token_type: 'access' | 'refresh';
      };
      if (payload.token_type !== expectedType) {
        throw new UnauthorizedException('Invalid token type.');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private async requireUserRecord(userId: string): Promise<AuthUserRecord> {
    const user = await this.userRepository.findById<AuthUserRecord>(
      userId,
      'id,full_name,email,contact_number,role,status',
    );

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }
}
