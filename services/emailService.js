import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_EMAIL_FROM_NAME = 'Nuri Task API';
const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

/**
 * Servicio para enviar correos electrónicos
 */
export class EmailService {
  /**
   * Crea y configura el transportador de nodemailer
   * @returns {nodemailer.Transporter} Transportador configurado
   * Configura nodemailer con las credenciales del archivo .env
   */
  static createTransport() {
    // Configuración para diferentes proveedores de email
    // Puedes usar Gmail, Outlook, o cualquier SMTP

    if (process.env.EMAIL_SERVICE === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    // SMTP genérico
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || DEFAULT_SMTP_HOST,
      port: process.env.EMAIL_PORT || DEFAULT_SMTP_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Envía un correo de recuperación de contraseña
   * @param {string} email - Email del destinatario
   * @param {string} resetToken - Token de recuperación
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<{success: boolean, message: string}>} Resultado del envío
   * Envía un email con el enlace para resetear la contraseña
   */
  static async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const transporter = this.createTransport();

      const resetUrl = `${process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || DEFAULT_EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de Contraseña - Nuri Task',
        html: `
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Recuperación de Contraseña</title>
              <style>
                @import url("https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap");
                body {
                  line-height: 1.6;
                  color: #37241c;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                h1, h2, h3, h4, h5, h6 {
                  font-family: "Montserrat Alternates", sans-serif;
                  font-weight: bold;
                  font-size: 2rem;
                }
                p {
                  font-family: "Nunito Sans", sans-serif;
                  font-size: 1.5rem;
                }
                a {
                  font-family: "Nunito Sans", sans-serif;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: #2f9685 !important;
                }
                .container {
                  background-color: #f7f6f2;
                  border-radius: 10px;
                  padding: 30px;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                  color: #3A251D;
                  }
                .title-container {
                  background: linear-gradient(135deg, #2f9685 0%, #2f9685 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background-color: #F7F6F2;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;

                }
                .button {
                  display: inline-block;
                  font-family: "Nunito Sans", sans-serif;
                  font-weight: bold;
                  padding: 12px 30px;
                  background: linear-gradient(135deg, #2f9685 0%, #2f9685 100%);
                  color: white !important;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .button:hover {
                  background: linear-gradient(135deg, #2a8878 0%, #2a8878 100%);
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #37241cb5;
                }
                .warning {
                  font-family: "Nunito Sans", sans-serif;
                  background-color: #fff3cd;
                  border-left: 4px solid #ffc107;
                  padding: 10px;
                  margin: 15px 0;
                }
                .token-box {
                  background-color: #f8f9fa;
                  border: 2px dashed #75bdc9;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 5px;
                  text-align: center;
                  font-family: "Courier New", monospace;
                  font-size: 18px;
                  font-weight: bold;
                  color: #2a8878;
                  font-family: 'Nunito Sans', sans-serif;
                }
                .link{
                  color: #2f9685 !important;

                }
                .button-link{
                  text-align: center
                }
              </style>
            </head>
            <body>
              <header>
                <div class="title-container">
                  <h1>🔐 Recuperación de Contraseña <strong>Nuri Task</strong></h1>
                </div>
              </header>
              <main class="container">
                <div class="content">
                  <h2>Hola, <strong>${userName}</strong>!</h2>
                  <p>
                    Hemos recibido una solicitud para restablecer la contraseña de tu
                    cuenta en <strong>Nuri Task</strong>.
                  </p>
                  <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
                  <div class="button-link">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                  </div>
                  <p>O copia y pega este enlace en tu navegador:</p>
                  <p>
                    <a class="link" href="${resetUrl}">${resetUrl}</a>
                  </p>
                  <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                      <li>Este enlace expirará en <strong>1 hora</strong></li>
                      <li>Si no solicitaste este cambio, ignora este correo</li>
                      <li>Tu contraseña actual seguirá siendo válida</li>
                    </ul>
                  </div>
                  <p>Si tienes algún problema, contáctanos respondiendo a este correo.</p>
                  <p>Saludos,<br /><strong>Equipo de Nuri Task</strong></p>
                </div>
              </main>
              <footer class="footer">
                <p>Este es un correo automático, por favor no respondas directamente.</p>
                <p>
                  &copy; ${new Date().getFullYear()} Nuri Task API. Todos los derechos
                  reservados.
                </p>
              </footer>
            </body>
          </html>
        `,
      };

      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);

      console.log(chalk.green('✓ Email enviado correctamente:'), info.messageId);
      return {
        success: true,
        message: 'Email de recuperación enviado correctamente',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(chalk.red('✗ Error al enviar email:'), error);
      return {
        success: false,
        message: 'Error al enviar el email de recuperación',
        error: error.message,
      };
    }
  }

  /**
   * Envía un correo de verificación de email al usuario
   * @param {string} email - Email del destinatario
   * @param {string} verificationToken - Token de verificación
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<{success: boolean, message: string}>} Resultado del envío
   */
  static async sendVerificationEmail(email, verificationToken, userName) {
    try {
      const transporter = this.createTransport();

      const frontendBase = (process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
      const verifyUrl = `${frontendBase}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || DEFAULT_EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verificá tu email - Nuri Task',
        html: `
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verificación de Email</title>
              <style>
                @import url("https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap");
                body { line-height: 1.6; color: #37241c; max-width: 600px; margin: 0 auto; padding: 20px; }
                h1, h2 { font-family: "Montserrat Alternates", sans-serif; font-weight: bold; font-size: 2rem; }
                p { font-family: "Nunito Sans", sans-serif; font-size: 1.5rem; }
                .container { background-color: #f7f6f2; border-radius: 10px; padding: 30px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                .title-container { background: linear-gradient(135deg, #2f9685 0%, #2f9685 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background-color: #F7F6F2; padding: 30px; border-radius: 0 0 10px 10px; color: #3A251D; }
                .button { display: inline-block; font-family: "Nunito Sans", sans-serif; font-weight: bold; padding: 12px 30px; background: linear-gradient(135deg, #2f9685 0%, #2f9685 100%); color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .button:hover { background: linear-gradient(135deg, #2a8878 0%, #2a8878 100%); }
                .footer { font-family: "Nunito Sans", sans-serif; text-align: center; margin-top: 20px; font-size: 12px; color: #37241cb5; }
                .warning { font-family: "Nunito Sans", sans-serif; background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
                .button-link { text-align: center; }
                .link { color: #2f9685 !important; font-family: "Nunito Sans", sans-serif; font-weight: bold; font-size: 1.5rem; }
              </style>
            </head>
            <body>
              <header>
                <div class="title-container">
                  <h1>✉️ Verificá tu email en <strong>Nuri Task</strong></h1>
                </div>
              </header>
              <main class="container">
                <div class="content">
                  <h2>¡Hola, <strong>${userName}</strong>!</h2>
                  <p>Gracias por registrarte en <strong>Nuri Task</strong>. Para activar tu cuenta, verificá tu email haciendo clic en el botón:</p>
                  <div class="button-link">
                    <a href="${verifyUrl}" class="button">Verificar mi email</a>
                  </div>
                  <p>O copiá y pegá este enlace en tu navegador:</p>
                  <p><a class="link" href="${verifyUrl}">${verifyUrl}</a></p>
                  <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                      <li>Este enlace expira en <strong>1 hora</strong></li>
                      <li>Si no creaste esta cuenta, ignorá este correo</li>
                    </ul>
                  </div>
                  <p>¡Te esperamos!</p>
                  <p>Saludos,<br /><strong>Equipo de Nuri Task</strong></p>
                </div>
              </main>
              <footer class="footer">
                <p>Este es un correo automático, por favor no respondas directamente.</p>
                <p>&copy; ${new Date().getFullYear()} Nuri Task. Todos los derechos reservados.</p>
              </footer>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(chalk.green('✓ Email de verificación enviado:'), info.messageId);
      return { success: true, message: 'Email de verificación enviado correctamente', messageId: info.messageId };
    } catch (error) {
      console.error(chalk.red('✗ Error al enviar email de verificación:'), error);
      return { success: false, message: 'Error al enviar el email de verificación', error: error.message };
    }
  }

  /**
   * Envía un correo de confirmación después de resetear la contraseña
   * @param {string} email - Email del destinatario
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<{success: boolean, message: string}>} Resultado del envío
   * Envía un email de confirmación cuando la contraseña ha sido cambiada exitosamente
   */
  static async sendPasswordChangedConfirmation(email, userName) {
    try {
      const transporter = this.createTransport();

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || DEFAULT_EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Contraseña Cambiada Exitosamente - Nuri Task',
        html: `
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Contraseña Actualizada</title>
              <style>
                @import url("https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap");
                body {
                  line-height: 1.6;
                  color: #37241c;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                h1, h2, h3, h4, h5, h6 {
                  font-family: "Montserrat Alternates", sans-serif;
                  font-weight: bold;
                  font-size: 2rem;
                }
                p {
                  font-family: "Nunito Sans", sans-serif;
                  font-size: 1.5rem;
                }
                a {
                  font-family: "Nunito Sans", sans-serif;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: #2f9685;
                }
                .container {
                  background-color: #f7f6f2;
                  border-radius: 10px;
                  padding: 30px;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                .title-container {
                  background: linear-gradient(135deg, #2f9685 0%, #2f9685 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background-color: #F7F6F2;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                  color: #3A251D;
                }
                .success-icon {
                  font-size: 48px;
                  text-align: center;
                  margin: 20px 0;
                }
                .footer {
                  font-family: "Nunito Sans", sans-serif;
                  text-align: center;
                  margin-top: 20px;
                  font-size: 12px;
                  color: #37241cb5;
                }
                .warning {
                  font-family: "Nunito Sans", sans-serif;
                  background-color: #fff3cd;
                  border-left: 4px solid #ffc107;
                  padding: 10px;
                  margin: 15px 0;
                }
              </style>
            </head>
            <body>
              <header>
                <div class="title-container">
                  <h1>✅ Contraseña Actualizada <strong>Nuri Task</strong></h1>
                </div>
              </header>
              <main class="container">
                <div class="content">
                  <div class="success-icon">🎉</div>
                  <h2>Hola, <strong>${userName}</strong>!</h2>
                  <p>Tu contraseña ha sido cambiada exitosamente.</p>
                  <p>Si realizaste este cambio, puedes ignorar este correo.</p>
                  <div class="warning">
                    <strong>⚠️ ¿No fuiste tú?</strong>
                    <br>
                    Si NO realizaste este cambio, tu cuenta puede estar comprometida. 
                    Por favor, contáctanos inmediatamente respondiendo a este correo.
                  </div>
                  <p>Fecha y hora del cambio: <strong>${new Date().toLocaleString('es-ES')}</strong></p>
                  <p>Saludos,<br /><strong>Equipo de Nuri Task</strong></p>
                </div>
              </main>
              <footer class="footer">
                <p>Este es un correo automático, por favor no respondas directamente.</p>
                <p>
                  &copy; ${new Date().getFullYear()} Nuri Task API. Todos los derechos
                  reservados.
                </p>
              </footer>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);

      console.log(chalk.green('✓ Email de confirmación enviado:'), info.messageId);
      return {
        success: true,
        message: 'Email de confirmación enviado correctamente',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(chalk.red('✗ Error al enviar email de confirmación:'), error);
      return {
        success: false,
        message: 'Error al enviar el email de confirmación',
        error: error.message,
      };
    }
  }
}
