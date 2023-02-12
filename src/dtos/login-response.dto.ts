export class LoginResponseDto {
  token: string | null;

  refreshToken: string | null;

  message?: string;
}
