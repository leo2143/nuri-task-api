import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '24h';
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRATION_MS = 3600000;
const VERIFICATION_TOKEN_EXPIRATION_MS = 3600000;
const RESEND_COOLDOWN_MS = 60000;
/** Hash de un plaintext fijo (no es credencial). Iguala timing de login si el user no existe. */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('nuri-timing-dummy', BCRYPT_SALT_ROUNDS);

export class UserServiceHelpers {
  static async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Compara contra un hash dummy para no filtrar existencia de user por timing.
   */
  static async verifyDummyPassword(plainPassword) {
    return bcrypt.compare(plainPassword, DUMMY_PASSWORD_HASH);
  }

  /**
   * True si el token de verificación se emitió hace menos del cooldown de reenvío (60s).
   */
  static isVerificationResendOnCooldown(expiresAt) {
    if (!expiresAt) {
      return false;
    }
    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    return remainingMs > VERIFICATION_TOKEN_EXPIRATION_MS - RESEND_COOLDOWN_MS;
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateResetToken() {
    return crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  }

  static getResetTokenExpiration() {
    return Date.now() + RESET_TOKEN_EXPIRATION_MS;
  }

  static getVerificationTokenExpiration() {
    return Date.now() + VERIFICATION_TOKEN_EXPIRATION_MS;
  }

  /**
   * Lee JWT_SECRET
   */
  static getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado');
    }
    return secret;
  }

  static generateJWT(payload) {
    return jwt.sign(payload, this.getJwtSecret(), { expiresIn: TOKEN_EXPIRATION });
  }

  static createJWTPayload(user) {
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
  }

  /**
   * Quita hash y tokens antes de responder
   */
  static sanitizeUser(user) {
    if (!user) return user;
    const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete plain.password;
    delete plain.resetPasswordToken;
    delete plain.resetPasswordExpires;
    delete plain.emailVerificationToken;
    delete plain.emailVerificationExpires;
    return plain;
  }
}
