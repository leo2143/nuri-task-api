import { createServer, startServer } from './server-config.js';
import { setupRoutes } from './routes/routes.js';

// Crear el servidor
const { app, PORT } = createServer();

// Configurar todas las rutas
setupRoutes(app);

// Iniciar el servidor solo si no estamos en Vercel
if (process.env.VERCEL !== '1') {
  startServer(app, PORT);
}

// Exportar app para Vercel
export default app;
