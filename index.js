import { createServer, startServer } from './server-config.js';
import { setupRoutes } from './routes/routes.js';

// Crear el servidor
const { app, PORT } = createServer();

// Configurar todas las rutas
setupRoutes(app);

// Iniciar el servidor
startServer(app, PORT);
