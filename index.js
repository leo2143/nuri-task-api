import { createServer, startServer } from './server-config.js';
import { setupRoutes } from './controllers/routes.js';

// Crear el servidor
const { app, PORT } = createServer();

// Configurar las rutas
setupRoutes(app);

// Iniciar el servidor
startServer(app, PORT);
