import { OAuth2Client } from 'google-auth-library';
import User from '../models/userModel.js';
import {
  SuccessResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { UserServiceHelpers } from './helpers/userServiceHelpers.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { MoodboardService } from './moodboardService.js';
import { GoogleLoginDto } from '../models/dtos/auth/index.js';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export class GoogleAuthService {
  /**
   * Intercambia el authorization code de Google por información del usuario
   * @param {string} code - Authorization code del frontend
   * @returns {Promise<{googleId: string, email: string, name: string, picture: string, emailVerified: boolean}>}
   */
  static async exchangeCodeForUserInfo(code) {
    const { tokens } = await oAuth2Client.getToken(code);
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified === true,
    };
  }

  /**
   * Autentica o registra un usuario con Google OAuth
   * @param {Object} body - Body con authorization code
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel|BadRequestResponseModel>}
   */
  static async loginWithGoogle(body) {
    try {
      const loginDto = new GoogleLoginDto(body || {});
      const validation = loginDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { code } = loginDto.toPlainObject();
      const googleUser = await this.exchangeCodeForUserInfo(code);

      if (!googleUser.emailVerified) {
        return new BadRequestResponseModel(
          'Google no verificó este email. Iniciá con otra cuenta o verificá el correo en Google.'
        );
      }

      let user = await User.findOne({
        $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      });

      let isNewUser = false;

      if (!user) {
        user = new User({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.googleId,
          profileImageUrl: googleUser.picture,
          emailVerified: true,
        });
        await user.save();
        const moodboardResult = await MoodboardService.createMoodboardForUser(user._id);
        if (!moodboardResult.success) {
          await User.deleteOne({ _id: user._id });
          return new ErrorResponseModel('No se pudo completar el registro con Google. Intentá de nuevo');
        }
        isNewUser = true;
      } else if (!user.googleId) {
        if (user.password && !user.emailVerified) {
          return new BadRequestResponseModel(
            'Este email ya tiene una cuenta. Verificalo o iniciá con tu contraseña.'
          );
        }
        user.googleId = googleUser.googleId;
        user.emailVerified = true;
        if (!user.profileImageUrl && googleUser.picture) {
          user.profileImageUrl = googleUser.picture;
        }
        await user.save();
      } else if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }

      const payload = UserServiceHelpers.createJWTPayload(user);
      const token = UserServiceHelpers.generateJWT(payload);

      const userResponse = user.toObject();
      userResponse.hasPassword = !!userResponse.password;
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpires;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;
      if (userResponse.subscription) {
        delete userResponse.subscription.endDate;
        delete userResponse.subscription.startDate;
      }

      return new SuccessResponseModel(
        {
          token,
          user: userResponse,
        },
        isNewUser ? 'Registro con Google exitoso' : 'Login con Google exitoso'
      );
    } catch (error) {
      if (error.message?.includes('invalid_grant') || error.message?.includes('Invalid Value')) {
        return new BadRequestResponseModel('Código de autorización inválido o expirado');
      }
      console.error('Error en login con Google:', error);
      return ErrorHandler.handleDatabaseError(error, 'autenticar con Google');
    }
  }
}
