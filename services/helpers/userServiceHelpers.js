import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '24h';
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRATION_MS = 3600000;
const DEFAULT_TEMP_PASSWORD_LENGTH = 12;

export class UserServiceHelpers {
  static async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
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

  static generateJWT(payload, secret) {
    return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRATION });
  }

  static generateTemporaryPassword(length = DEFAULT_TEMP_PASSWORD_LENGTH) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return Array.from({ length }, () => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
  }

  static createJWTPayload(user) {
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
  }
}
