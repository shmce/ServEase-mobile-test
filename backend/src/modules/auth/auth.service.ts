import {
  Injectable,
  Inject,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
} from '../../database/supabase.module';
import { RegisterProviderDto } from './dto/create-provider.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserRepository } from '../users/repositories/user.repository';
import { handleSupabaseError } from '../../common/utils/supabase-error.handler';
import 'multer';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    private readonly userRepository: UserRepository,
  ) {}

  async register(dto: any) {
    try {
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

      return { status: 201, message: 'Registration Successful.', userId };
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
      const userData = await this.userRepository.findById(
        userId,
        'role, status',
      );

      if (userData.status === 'pending' || userData.status === 'rejected') {
        await this.supabase.auth.signOut();
        throw new UnauthorizedException({
          message: 'Access Denied: Provider account is not yet active.',
          current_status: userData.status,
        });
      }

      return {
        message: 'STATUS 200 OK',
        access_token: data.session?.access_token,
        user_id: data.user?.id,
        role: userData.role,
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
      await this.userRepository.create({
        id: newUserId,
        full_name,
        email,
        contact_number,
        role,
        status: 'pending',
        is_verified: false,
        date_of_birth,
      });
    } catch (userError) {
      await this.supabase.auth.admin.deleteUser(newUserId);
      throw new BadRequestException(`User Profile Error: ${userError.message}`);
    }

    const { data: profile, error: profileError } = await this.catalogDb
      .from('provider_profiles')
      .insert([
        { user_id: newUserId, business_name, verification_status: 'pending' },
      ])
      .select('id, business_name, verification_status')
      .single();

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
      status: 'success',
      message: 'Provider application submitted. Pending approval.',
      data: {
        provider_id: newUserId,
        business_name: profile.business_name,
        verification_status: profile.verification_status,
      },
    };
  }
}
