import { GoogleAuthService } from '../../services/googleAuthService.js';
import { attachAuthCookie } from '../../middlewares/authCookie.js';

export class GoogleAuthController {
  static async googleLogin(req, res) {
    const result = attachAuthCookie(res, await GoogleAuthService.loginWithGoogle(req.body));
    res.status(result.status).json(result);
  }
}
