import { GoogleAuthService } from '../../services/googleAuthService.js';

export class GoogleAuthController {
  static async googleLogin(req, res) {
    const { code } = req.body;
    const result = await GoogleAuthService.loginWithGoogle(code);
    res.status(result.status).json(result);
  }
}
