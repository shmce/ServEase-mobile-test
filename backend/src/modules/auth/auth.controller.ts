import {
  Controller,
  Post,
  Body,
  HttpCode,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  UploadedFile,
  Version,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisterProviderDto } from './dto/create-provider.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AppAuthGuard } from './guards/app-auth.guard';
import 'multer';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Version('1')
  @Post('register/customer')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Version('1')
  @Post('register/provider')
  @UseInterceptors(FileInterceptor('document_file'))
  async registerProviderV1(
    @Body() dto: RegisterProviderDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|jpg|png)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.authService.registerProvider(dto, file);
  }

  @Version('1')
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @Version('2')
  @Post('register')
  @UseInterceptors(FileInterceptor('document_file'))
  async registerProvider(
    @Body() dto: RegisterProviderDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|jpg|png)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.authService.registerProvider(dto, file);
  }

  @Version('1')
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Version('1')
  @Post('logout')
  @HttpCode(200)
  @UseGuards(AppAuthGuard)
  async logout() {
    return this.authService.logout();
  }

  @Version('1')
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Version('1')
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Version('1')
  @Get('me')
  @UseGuards(AppAuthGuard)
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.authUser.sub);
  }
}
