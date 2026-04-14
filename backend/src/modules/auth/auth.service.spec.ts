import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  IDENTITY_CLIENT,
  CATALOG_CLIENT,
} from '../../database/supabase.module';
import { UserRepository } from '../users/repositories/user.repository';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let supabase: jest.Mocked<SupabaseClient>;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
    };
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      }),
    };

    const mockUserRepository = {
      findById: jest.fn(),
      findByContactNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SupabaseClient, useValue: mockSupabase },
        { provide: IDENTITY_CLIENT, useValue: mockSupabase },
        { provide: CATALOG_CLIENT, useValue: mockSupabase },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabase = module.get(SupabaseClient);
    userRepository = module.get(UserRepository);
  });

  describe('login', () => {
    it('should return a token and role for valid credentials', async () => {
      const loginDto = {
        identifier: 'test@example.com',
        password: 'Password123!',
      };
      const mockUser = { id: 'uuid-123', email: 'test@example.com' };
      const mockUserData = {
        id: 'uuid-123',
        email: 'test@example.com',
        full_name: 'Test User',
        contact_number: '09123456789',
        role: 'customer',
        status: 'active',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'valid-token' } },
        error: null,
      } as any);

      userRepository.findById.mockResolvedValueOnce({
        role: 'customer',
        status: 'active',
      } as any);
      userRepository.findById.mockResolvedValueOnce(mockUserData as any);

      const result = await service.login(loginDto);

      expect(result).toMatchObject({
        message: 'STATUS 200 OK',
        role: 'customer',
        user: {
          id: 'uuid-123',
          email: 'test@example.com',
          role: 'customer',
        },
      });
      expect(result.access_token).toBeTruthy();
      expect(result.refresh_token).toBeTruthy();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = { identifier: 'test@example.com', password: 'wrong' };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid Credentials' },
      } as any);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should deny access for pending providers', async () => {
      const loginDto = {
        identifier: 'provider@example.com',
        password: 'Password123!',
      };
      const mockUser = { id: 'uuid-456' };
      const mockUserData = { role: 'provider', status: 'pending' };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      } as any);

      userRepository.findById.mockResolvedValueOnce(mockUserData as any);
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: null,
      } as any);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
