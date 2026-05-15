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
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage'
);

export class GoogleAuthService {
  /**
   * Intercambia el authorization code de Google por información del usuario
   * @param {string} code - Authorization code del frontend
   * @returns {Promise<{googleId: string, email: string, name: string, picture: string}>}
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
    };
  }

  /**
   * Autentica o registra un usuario con Google OAuth
   * @param {string} code - Authorization code del frontend
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel|BadRequestResponseModel>}
   */
  static async loginWithGoogle(code) {
    try {
      if (!code) {
        return new BadRequestResponseModel('El código de autorización es requerido');
      }

      const googleUser = await this.exchangeCodeForUserInfo(code);
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
        });
        await user.save();
        await MoodboardService.createMoodboardForUser(user._id);
        isNewUser = true;
      } else if (!user.googleId) {
        user.googleId = googleUser.googleId;
        if (!user.profileImageUrl && googleUser.picture) {
          user.profileImageUrl = googleUser.picture;
        }
        await user.save();
      }

      const payload = UserServiceHelpers.createJWTPayload(user);
      const token = UserServiceHelpers.generateJWT(payload, JWT_SECRET);

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpires;
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
