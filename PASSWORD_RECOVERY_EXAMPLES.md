# 🧪 Ejemplos de Prueba - Recuperación de Contraseña

Este archivo contiene ejemplos de cómo probar los endpoints de recuperación de contraseña usando cURL, Postman o Thunder Client.

## 📋 Requisitos Previos

1. Servidor corriendo en `http://localhost:3000`
2. Variables de entorno configuradas (ver `EMAIL_SETUP.md`)
3. Un usuario existente en la base de datos

## 🚀 Flujo Completo de Prueba

### Paso 1: Crear un usuario de prueba (si no existe)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Prueba",
    "email": "prueba@ejemplo.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": 201,
  "message": "Usuario creado correctamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Usuario Prueba",
    "email": "prueba@ejemplo.com"
  }
}
```

---

### Paso 2: Solicitar recuperación de contraseña

```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@ejemplo.com"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": 200,
  "message": "Email de recuperación enviado",
  "data": {
    "message": "Si el email existe, recibirás un correo con instrucciones",
    "devToken": "abc123def456..." // Solo en desarrollo
  }
}
```

**¿Qué sucede?**
- Se genera un token único
- Se guarda hasheado en la base de datos
- Se envía un email al usuario con el token
- El token expira en 1 hora

**Revisa tu email** y busca el correo con el asunto "Recuperación de Contraseña - Nuri Task"

---

### Paso 3: Verificar el token (Opcional pero recomendado)

Antes de mostrar el formulario de nueva contraseña, verifica que el token sea válido:

```bash
curl -X GET http://localhost:3000/api/users/verify-reset-token/abc123def456...
```

Reemplaza `abc123def456...` con el token que recibiste por email o en la respuesta del Paso 2 (si estás en desarrollo).

**Respuesta esperada (token válido):**
```json
{
  "success": true,
  "status": 200,
  "message": "Token verificado correctamente",
  "data": {
    "valid": true,
    "email": "prueba@ejemplo.com",
    "message": "Token válido"
  }
}
```

**Respuesta esperada (token inválido o expirado):**
```json
{
  "success": false,
  "status": 500,
  "message": "Token inválido o expirado",
  "data": null
}
```

---

### Paso 4: Resetear la contraseña con el token

```bash
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "newPassword": "nuevaPassword456"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": 200,
  "message": "Contraseña reseteada correctamente",
  "data": {
    "message": "Contraseña actualizada exitosamente",
    "email": "prueba@ejemplo.com"
  }
}
```

**¿Qué sucede?**
- Se verifica el token
- Se actualiza la contraseña (hasheada con bcrypt)
- Se eliminan los tokens de recuperación
- Se envía un email de confirmación

**Revisa tu email** y busca el correo con el asunto "Contraseña Cambiada Exitosamente - Nuri Task"

---

### Paso 5: Iniciar sesión con la nueva contraseña

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@ejemplo.com",
    "password": "nuevaPassword456"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "status": 200,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Usuario Prueba",
      "email": "prueba@ejemplo.com"
    }
  }
}
```

---

## 📱 Ejemplos para Postman

### Colección de Postman

Puedes importar esta colección JSON en Postman:

```json
{
  "info": {
    "name": "Nuri Task - Password Recovery",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Solicitar Recuperación",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"prueba@ejemplo.com\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/users/forgot-password",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "users", "forgot-password"]
        }
      }
    },
    {
      "name": "2. Verificar Token",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/users/verify-reset-token/{{token}}",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "users", "verify-reset-token", "{{token}}"]
        }
      }
    },
    {
      "name": "3. Resetear Contraseña",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token\": \"{{token}}\",\n  \"newPassword\": \"nuevaPassword456\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/users/reset-password",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "users", "reset-password"]
        }
      }
    },
    {
      "name": "4. Login con Nueva Contraseña",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"prueba@ejemplo.com\",\n  \"password\": \"nuevaPassword456\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/users/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "users", "login"]
        }
      }
    }
  ]
}
```

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Email no existe

```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "noexiste@ejemplo.com"}'
```

**Resultado:** Devuelve éxito (por seguridad, no revela si el email existe)

---

### ✅ Caso 2: Token expirado

1. Solicita recuperación
2. Espera más de 1 hora (o modifica el código temporalmente para testing)
3. Intenta usar el token

**Resultado:** "Token inválido o expirado"

---

### ✅ Caso 3: Token ya usado

1. Solicita recuperación
2. Resetea la contraseña con el token
3. Intenta usar el mismo token otra vez

**Resultado:** "Token inválido o expirado" (el token se elimina después del primer uso)

---

### ✅ Caso 4: Contraseña muy corta

```bash
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "newPassword": "123"
  }'
```

**Resultado:** "La contraseña debe tener al menos 6 caracteres"

---

### ✅ Caso 5: Email vacío

```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resultado:** "El email es requerido"

---

## 🎯 Variables de Entorno de Prueba

Para facilitar las pruebas, configura estas variables en Postman:

| Variable | Valor |
|----------|-------|
| `base_url` | `http://localhost:3000` |
| `token` | (Se actualiza después del paso 1) |
| `test_email` | `prueba@ejemplo.com` |
| `old_password` | `password123` |
| `new_password` | `nuevaPassword456` |

---

## 📊 Monitoreo de Logs

Al ejecutar las pruebas, observa los logs del servidor:

```bash
# En la terminal donde corre el servidor verás:
✓ Token de recuperación generado para: prueba@ejemplo.com
✓ Email enviado correctamente: <message-id>
✓ Contraseña reseteada exitosamente para: prueba@ejemplo.com
```

Si algo falla, verás:
```bash
✗ Error al enviar email: [detalle del error]
Error al solicitar recuperación de contraseña: [detalle del error]
```

---

## 🔍 Verificar en MongoDB

Puedes verificar los cambios directamente en MongoDB:

```javascript
// Conectarse a MongoDB
mongo

// Usar la base de datos
use nuri-task-db

// Ver el usuario con el token de recuperación
db.users.findOne({ email: "prueba@ejemplo.com" })

// Deberías ver algo como:
{
  "_id": ObjectId("..."),
  "name": "Usuario Prueba",
  "email": "prueba@ejemplo.com",
  "password": "$2b$10$...", // Contraseña hasheada
  "resetPasswordToken": "abc123def456...", // Token hasheado
  "resetPasswordExpires": ISODate("2024-..."), // Fecha de expiración
  "isAdmin": false
}

// Después de resetear la contraseña, estos campos deben ser null:
// "resetPasswordToken": null
// "resetPasswordExpires": null
```

---

## 🎨 Ejemplo de Email HTML

El usuario recibirá un email con este formato:

```
┌─────────────────────────────────────┐
│    🔐 Recuperación de Contraseña    │
└─────────────────────────────────────┘

Hola, Usuario Prueba!

Hemos recibido una solicitud para restablecer 
la contraseña de tu cuenta en Nuri Task.

        [Restablecer Contraseña]

Token: abc123def456...

⚠️ Importante:
• Este enlace expirará en 1 hora
• Si no solicitaste este cambio, ignora este correo
• Tu contraseña actual seguirá siendo válida
```

---

## 💡 Tips para el Frontend

Si estás desarrollando el frontend, el flujo recomendado es:

1. **Página "Olvidé mi contraseña"**
   - Input de email
   - Botón "Enviar"
   - POST a `/api/users/forgot-password`
   - Mostrar: "Revisa tu email"

2. **Página de "Reset" (cuando el usuario hace clic en el enlace del email)**
   - Extraer token de la URL: `?token=abc123...`
   - Verificar token: GET `/api/users/verify-reset-token/:token`
   - Si válido: Mostrar formulario de nueva contraseña
   - Si inválido: Mostrar "Token expirado o inválido"

3. **Formulario de nueva contraseña**
   - Input de nueva contraseña
   - Input de confirmar contraseña
   - Validación: mínimo 6 caracteres
   - POST a `/api/users/reset-password` con token + newPassword
   - Redirigir a login con mensaje de éxito

---

## 📝 Checklist de Pruebas

- [ ] Email se envía correctamente
- [ ] Email llega a la bandeja de entrada (no spam)
- [ ] Token se guarda hasheado en la BD
- [ ] Token expira después de 1 hora
- [ ] Token se elimina después de usarse
- [ ] No se puede reusar un token
- [ ] Validación de contraseña mínima (6 caracteres)
- [ ] Email de confirmación se envía
- [ ] Login funciona con nueva contraseña
- [ ] Login NO funciona con contraseña antigua
- [ ] No revela si un email existe o no
- [ ] Emails tienen diseño HTML profesional

---

**¿Problemas?** Revisa [EMAIL_SETUP.md](EMAIL_SETUP.md) para troubleshooting.

