import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RefreshTokenRequestDto } from './dtos/refresh-token-request.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { VerifyTokenRequestDto } from './dtos/verify-token-request.dto';
import { User } from './entities/user.entity';

@Controller()
export class AuthController {
  constructor(private readonly appService: AuthService) {}

  @MessagePattern({ cmd: 'verify-jwt' })
  verifyJwt(@Payload() payload: VerifyTokenRequestDto): Promise<any> {
    return this.appService.verifyJwt(payload.jwt);
  }

  @MessagePattern({ cmd: 'get-user-by-id' })
  async getUserById(@Payload() data: { userId: number }): Promise<User> {
    return this.appService.getUserById(data.userId);
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async refreshToken(@Payload() data: RefreshTokenRequestDto) {
    try {
      return this.appService.refreshToken(data.refreshToken);
    } catch (err) {
      return {
        message: err.message,
      };
    }
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() payload: LoginRequestDto): Promise<LoginResponseDto> {
    try {
      return await this.appService.login(payload);
    } catch (err) {
      return {
        token: null,
        refreshToken: null,
        message: err.message,
      };
    }
  }

  @MessagePattern({ cmd: 'register' })
  async register(
    @Payload() payload: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    try {
      return await this.appService.register(payload);
    } catch (err) {
      return {
        user: null,
        message: err.message,
      };
    }
  }
}
