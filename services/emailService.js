import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

/**
 * Servicio para enviar correos electrónicos
 * @class EmailService
 */
export class EmailService {
  /**
   * Crea y configura el transportador de nodemailer
   * @static
   * @returns {nodemailer.Transporter} Transportador configurado
   * @description Configura nodemailer con las credenciales del archivo .env
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
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Envía un correo de recuperación de contraseña
   * @static
   * @async
   * @function sendPasswordResetEmail
   * @param {string} email - Email del destinatario
   * @param {string} resetToken - Token de recuperación
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<{success: boolean, message: string}>} Resultado del envío
   * @description Envía un email con el enlace para resetear la contraseña
   */
  static async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const transporter = this.createTransport();

      // URL del frontend donde el usuario ingresará la nueva contraseña
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Nuri Task API'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de Contraseña - Nuri Task',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 10px;
                margin: 15px 0;
              }
              .token-box {
                background-color: #f8f9fa;
                border: 2px dashed #667eea;
                padding: 15px;
                margin: 15px 0;
                border-radius: 5px;
                text-align: center;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: bold;
                color: #667eea;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
              </div>
              <div class="content">
                <h2>Hola, ${userName}!</h2>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Nuri Task</strong>.</p>
                
                <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #667eea;"><a href="${resetUrl}">${resetUrl}</a></p>
                
                <div class="token-box">
                  Token: ${resetToken}
                </div>
                
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul>
                    <li>Este enlace expirará en <strong>1 hora</strong></li>
                    <li>Si no solicitaste este cambio, ignora este correo</li>
                    <li>Tu contraseña actual seguirá siendo válida</li>
                  </ul>
                </div>
                
                <p>Si tienes algún problema, contáctanos respondiendo a este correo.</p>
                
                <p>Saludos,<br><strong>Equipo de Nuri Task</strong></p>
              </div>
              <div class="footer">
                <p>Este es un correo automático, por favor no respondas directamente.</p>
                <p>&copy; ${new Date().getFullYear()} Nuri Task API. Todos los derechos reservados.</p>
              </div>
            </div>
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
   * Envía un correo de confirmación después de resetear la contraseña
   * @static
   * @async
   * @function sendPasswordChangedConfirmation
   * @param {string} email - Email del destinatario
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<{success: boolean, message: string}>} Resultado del envío
   * @description Envía un email de confirmación cuando la contraseña ha sido cambiada exitosamente
   */
  static async sendPasswordChangedConfirmation(email, userName) {
    try {
      const transporter = this.createTransport();

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Nuri Task API'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Contraseña Cambiada Exitosamente - Nuri Task',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 20px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .success-icon {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 10px;
                margin: 15px 0;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Contraseña Actualizada</h1>
              </div>
              <div class="content">
                <div class="success-icon">🎉</div>
                <h2>Hola, ${userName}!</h2>
                <p>Tu contraseña ha sido cambiada exitosamente.</p>
                
                <p>Si realizaste este cambio, puedes ignorar este correo.</p>
                
                <div class="warning">
                  <strong>⚠️ ¿No fuiste tú?</strong><br>
                  Si NO realizaste este cambio, tu cuenta puede estar comprometida. 
                  Por favor, contáctanos inmediatamente respondiendo a este correo.
                </div>
                
                <p>Fecha y hora del cambio: <strong>${new Date().toLocaleString('es-ES')}</strong></p>
                
                <p>Saludos,<br><strong>Equipo de Nuri Task</strong></p>
              </div>
              <div class="footer">
                <p>Este es un correo automático, por favor no respondas directamente.</p>
                <p>&copy; ${new Date().getFullYear()} Nuri Task API. Todos los derechos reservados.</p>
              </div>
            </div>
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
