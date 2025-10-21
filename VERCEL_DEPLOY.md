# Guía de Despliegue en Vercel

## Configuración Necesaria

### 1. Archivos de Configuración
Ya se han creado los archivos necesarios:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `index.js` - Modificado para exportar la app y funcionar con Vercel

### 2. Variables de Entorno en Vercel

Debes configurar las siguientes variables de entorno en tu proyecto de Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

#### Variables Requeridas:

- **`MONGO_URI`**: 
  - Tu cadena de conexión de MongoDB
  - Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
  
- **`JWT_SECRET`**: 
  - Tu clave secreta para JWT
  - Ejemplo: `tu_clave_super_secreta_aqui`

- **`PORT`**: 
  - No es necesario en Vercel, pero puedes agregarlo por compatibilidad
  - Valor: `3000`

### 3. Despliegue

#### Opción A: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Importa el repositorio en Vercel
3. Vercel detectará automáticamente la configuración
4. Agrega las variables de entorno
5. Despliega

#### Opción B: Desde CLI de Vercel

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login en Vercel
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

### 4. Verificación

Después del despliegue, tus rutas deberían funcionar:

- `https://tu-app.vercel.app/` - Página principal
- `https://tu-app.vercel.app/api/todos` - API de todos
- `https://tu-app.vercel.app/api/users` - API de usuarios
- `https://tu-app.vercel.app/api/goals` - API de metas
- `https://tu-app.vercel.app/api/metrics` - API de métricas
- `https://tu-app.vercel.app/api/moodboard` - API de moodboard

### 5. Problemas Comunes

#### ❌ 404 en las rutas API
- **Causa**: Variables de entorno no configuradas
- **Solución**: Verifica que `MONGO_URI` y `JWT_SECRET` están configuradas en Vercel

#### ❌ Error de conexión a MongoDB
- **Causa**: `MONGO_URI` incorrecta o IP no autorizada
- **Solución**: 
  - Verifica la cadena de conexión
  - En MongoDB Atlas, permite acceso desde cualquier IP (0.0.0.0/0) en Network Access

#### ❌ Internal Server Error
- **Causa**: Error en el código o variables faltantes
- **Solución**: Revisa los logs en Vercel Dashboard → Functions → Ver logs

### 6. Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs

# Ver información del proyecto
vercel inspect

# Revertir a un despliegue anterior
vercel rollback
```

## Notas Importantes

- Vercel usa **serverless functions**, por lo que cada request es una nueva instancia
- Las conexiones a MongoDB se mantienen en caché, pero pueden cerrarse entre requests
- El directorio `public/` se sirve automáticamente como archivos estáticos
- Los logs están disponibles en el Vercel Dashboard

