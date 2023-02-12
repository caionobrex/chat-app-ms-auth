import { User } from 'src/entities/user.entity';

export class RegisterResponseDto {
  user: User | null;

  token?: string;

  refreshToken?: string;

  message?: string;
}
