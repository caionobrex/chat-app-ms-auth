import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginRequestDto } from './dtos/login-request.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { RegisterResponseDto } from './dtos/register-response.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @Inject('CHAT_SERVICE') private readonly chatService: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  verifyJwt(jwt: string): any {
    try {
      return this.jwtService.verify(jwt);
    } catch (err) {
      return null;
    }
  }

  async getUserById(userId: number): Promise<User> {
    const user: User = await this.usersRepository.findOneBy({ id: userId });
    delete user.password;
    return user;
  }

  refreshToken(refreshToken: string): RefreshTokenResponseDto {
    try {
      const { id, email } = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
      return {
        token: this.jwtService.sign({
          id,
          email,
        }),
        refreshToken: this.jwtService.sign(
          {
            id,
            email,
          },
          {
            expiresIn: '2h',
            secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          },
        ),
      };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.log('Login in user');
    const user: User = await this.usersRepository.findOneBy({
      email: data.user,
    });
    if (!user || !bcrypt.compareSync(data.password, user.password))
      throw new UnauthorizedException();
    return {
      token: this.jwtService.sign({
        id: user.id,
        email: user.email,
      }),
      refreshToken: this.jwtService.sign(
        {
          id: user.id,
          email: user.email,
        },
        {
          expiresIn: '2h',
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        },
      ),
    };
  }

  async register(data: RegisterRequestDto): Promise<RegisterResponseDto> {
    let user: User = await this.usersRepository.findOneBy({
      email: data.email,
    });
    if (user) throw new ConflictException();
    user = await this.usersRepository.save({
      email: data.email,
      name: data.username,
      password: bcrypt.hashSync(data.password, 10),
    });
    this.chatService.emit('user-created', {
      id: user.id,
      name: user.name,
    });
    delete user.password;
    return {
      user,
      token: this.jwtService.sign({ id: user.id, email: user.email }),
      refreshToken: this.jwtService.sign(
        {
          id: user.id,
          email: user.email,
        },
        { expiresIn: '2h' },
      ),
    };
  }
}
