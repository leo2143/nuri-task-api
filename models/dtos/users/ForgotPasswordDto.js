import { EmailDto } from './EmailDto.js';

/**
 * Body de forgot-password y resend-verification (solo email).
 */
export class ForgotPasswordDto extends EmailDto {
  static schema = EmailDto.schema;
}
