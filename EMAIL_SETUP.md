# 📧 Configuración de Email para Recuperación de Contraseña

Este documento explica cómo configurar nodemailer para el sistema de recuperación de contraseña.

## 🔑 Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Configuración de Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_FROM_NAME=Nuri Task API

# URL del frontend (para enlaces de recuperación)
FRONTEND_URL=http://localhost:3000

# Configuración SMTP opcional (si no usas Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Ambiente
NODE_ENV=development
```

## 📱 Configuración por Proveedor

### Opción 1: Gmail (Recomendado para desarrollo)

1. **Activar verificación en dos pasos**:
   - Ve a [Cuenta de Google](https://myaccount.google.com/)
   - Seguridad → Verificación en dos pasos
   - Actívala si no lo está

2. **Generar contraseña de aplicación**:
   - Ve a [Contraseñas de aplicaciones](https://myaccount.google.com/apppasswords)
   - Selecciona "Correo" como aplicación
   - Selecciona "Otro" como dispositivo y escribe "Nuri Task API"
   - Copia la contraseña de 16 caracteres generada
   - Úsala en `EMAIL_PASSWORD`

3. **Configuración en .env**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Sin espacios
EMAIL_FROM_NAME=Nuri Task API
FRONTEND_URL=http://localhost:3000
```

### Opción 2: Outlook/Hotmail

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu_contraseña
EMAIL_FROM_NAME=Nuri Task API
FRONTEND_URL=http://localhost:3000
```

### Opción 3: SMTP Genérico

Para cualquier otro proveedor de email:

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_PORT=587  # o 465 para SSL
EMAIL_SECURE=false  # true para puerto 465
EMAIL_USER=tu-email@dominio.com
EMAIL_PASSWORD=tu_contraseña
EMAIL_FROM_NAME=Nuri Task API
FRONTEND_URL=http://localhost:3000
```

### Opción 4: Servicios Profesionales (Producción)

Para producción, considera usar:

- **SendGrid**: Hasta 100 emails/día gratis
- **Mailgun**: Hasta 5,000 emails/mes gratis
- **Amazon SES**: Muy económico, alta confiabilidad
- **Postmark**: Especializado en emails transaccionales

## 🧪 Probar la Configuración

### 1. Verifica que las variables estén cargadas

```javascript
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
// NO imprimas EMAIL_PASSWORD en producción
```

### 2. Prueba enviando un email de recuperación

```bash
# Con cURL o Postman
POST http://localhost:3000/api/users/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

### 3. Revisa los logs

El servidor mostrará:
- ✓ Email enviado correctamente (si funciona)
- ✗ Error al enviar email (si falla)

## 🚀 Endpoints de Recuperación de Contraseña

### 1. Solicitar recuperación (Envía email con token)

```http
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "status": 200,
  "message": "Email de recuperación enviado",
  "data": {
    "message": "Si el email existe, recibirás un correo con instrucciones",
    "devToken": "abc123..." // Solo en desarrollo
  }
}
```

### 2. Verificar token (Antes de mostrar formulario de nueva contraseña)

```http
GET /api/users/verify-reset-token/:token
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "status": 200,
  "message": "Token verificado correctamente",
  "data": {
    "valid": true,
    "email": "usuario@ejemplo.com",
    "message": "Token válido"
  }
}
```

### 3. Resetear contraseña con token

```http
POST /api/users/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "nuevaContraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "status": 200,
  "message": "Contraseña reseteada correctamente",
  "data": {
    "message": "Contraseña actualizada exitosamente",
    "email": "usuario@ejemplo.com"
  }
}
```

## 🔒 Características de Seguridad

1. **Tokens hasheados**: Los tokens se almacenan hasheados en la BD
2. **Expiración**: Los tokens expiran en 1 hora
3. **Token de un solo uso**: El token se elimina después de usarse
4. **No revela emails**: No indica si un email existe o no (previene enumeración)
5. **Email de confirmación**: Se envía un email cuando la contraseña cambia
6. **Validación**: Contraseña mínima de 6 caracteres

## 📝 Flujo Completo de Usuario

1. Usuario hace clic en "Olvidé mi contraseña"
2. Ingresa su email
3. Si existe, recibe un email con un enlace
4. El enlace contiene el token: `http://frontend.com/reset-password?token=abc123...`
5. Frontend verifica el token antes de mostrar el formulario
6. Usuario ingresa nueva contraseña
7. Frontend envía token + nueva contraseña
8. Contraseña se actualiza
9. Usuario recibe email de confirmación
10. Usuario puede iniciar sesión con la nueva contraseña

## 🐛 Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solución para Gmail:**
- Asegúrate de haber activado la verificación en dos pasos
- Usa una contraseña de aplicación, no tu contraseña normal
- Verifica que no haya espacios en la contraseña

### Error: "self signed certificate in certificate chain"

**Solución:**
```env
NODE_TLS_REJECT_UNAUTHORIZED=0  # Solo para desarrollo
```

### Los emails van a spam

**Solución:**
1. En desarrollo: Revisa la carpeta de spam
2. En producción: Usa un servicio profesional (SendGrid, SES, etc.)
3. Configura SPF, DKIM y DMARC para tu dominio

### Error: "connect ECONNREFUSED"

**Solución:**
- Verifica que EMAIL_HOST y EMAIL_PORT sean correctos
- Revisa tu firewall/antivirus
- Intenta con otro puerto (587, 465, 25)

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SMTP Settings for Common Providers](https://nodemailer.com/smtp/well-known/)

---

**¿Necesitas ayuda?** Revisa los logs del servidor o contacta al equipo de desarrollo.

