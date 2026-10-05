import 'dotenv/config';
import { connectMongo, createServer, startServer } from './server-config.js';
import { setupRoutes } from './routes/routes.js';

export const config = { maxDuration: 60 };

const { app, PORT } = createServer();

setupRoutes(app);

if (process.env.VERCEL !== '1') {
  await connectMongo();
  startServer(app, PORT);
}

export default app;
