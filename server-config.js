import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { UserServiceHelpers } from './services/helpers/userServiceHelpers.js';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedConnection = null;
let connectPromise = null;

/**
 * Conecta a Mongo y reutiliza la promise en cold starts de Vercel.
 * @returns {Promise<mongoose.Connection|null>}
 */
export async function connectMongo() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️  MONGO_URI no está configurada');
    return null;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(mongoUri).then((mongooseInstance) => {
      cachedConnection = mongooseInstance.connection;
      console.log(chalk.green('🔗 Conexión a MongoDB establecida'));
      return cachedConnection;
    });
  }

  return connectPromise;
}

// Configuración del servidor
export const createServer = () => {
  try {
    UserServiceHelpers.getJwtSecret();
  } catch (error) {
    console.error(chalk.red(error.message));
    throw error;
  }

  const app = express();
  app.disable('x-powered-by');
  
  app.set('trust proxy', 1);
  const PORT = process.env.PORT || 3000;

  app.use(async (_req, _res, next) => {
    try {
      await connectMongo();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use(express.json());
  app.use(cookieParser());

  // Configurar CORS — allowlist exacta (sin substring). !origin: cron, curl, webhook MP.
  const allowedOrigins = getAllowedOrigins();
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));

  const publicPath = join(__dirname, 'public');
  app.use(express.static(publicPath));

  return { app, PORT };
};

/**
 * Origins explícitos para CORS. FRONTEND_URL (sin slash final) se suma si está definida.
 */
function getAllowedOrigins() {
  const origins = new Set([
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://nuri-task-app.vercel.app',
    'https://nuri-task-api.vercel.app',
  ]);

  const frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, '');
  if (frontendUrl) {
    origins.add(frontendUrl);
  }

  return [...origins];
}

// Función para iniciar el servidor
export const startServer = (app, PORT) => {
  app.listen(PORT, () => {
    console.log(
      chalk.cyan(`
        
 __    __                      __        ________                   __               ______   _______   ______ 
/  \  /  |                    /  |      /        |                 /  |             /      \ /       \ /      |
$$  \ $$ | __    __   ______  $$/       $$$$$$$$/______    _______ $$ |   __       /$$$$$$  |$$$$$$$  |$$$$$$/ 
$$$  \$$ |/  |  /  | /      \ /  |         $$ | /      \  /       |$$ |  /  |      $$ |__$$ |$$ |__$$ |  $$ |  
$$$$  $$ |$$ |  $$ |/$$$$$$  |$$ |         $$ | $$$$$$  |/$$$$$$$/ $$ |_/$$/       $$    $$ |$$    $$/   $$ |  
$$ $$ $$ |$$ |  $$ |$$ |  $$/ $$ |         $$ | /    $$ |$$      \ $$   $$<        $$$$$$$$ |$$$$$$$/    $$ |  
$$ |$$$$ |$$ \__$$ |$$ |      $$ |         $$ |/$$$$$$$ | $$$$$$  |$$$$$$  \       $$ |  $$ |$$ |       _$$ |_ 
$$ | $$$ |$$    $$/ $$ |      $$ |         $$ |$$    $$ |/     $$/ $$ | $$  |      $$ |  $$ |$$ |      / $$   |
$$/   $$/  $$$$$$/  $$/       $$/          $$/  $$$$$$$/ $$$$$$$/  $$/   $$/       $$/   $$/ $$/       $$$$$$/ 
                                                                                                               
                                                                                                               
                                                                                                               `)
    );
    console.log(chalk.green(`🚀 Servidor corriendo en http://localhost:${PORT}`));
  });
};
