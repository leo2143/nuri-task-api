import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache de conexión para Vercel
let cachedConnection = null;

// Configuración del servidor
export const createServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI;

  // Conectar a MongoDB (con manejo para Vercel)
  if (!cachedConnection) {
    if (MONGO_URI) {
      mongoose.connect(MONGO_URI, {});
      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once('open', () => {
        console.log(chalk.green('🔗 Conexión a MongoDB establecida'));
        cachedConnection = db;
      });
    } else {
      console.warn('⚠️  MONGO_URI no está configurada');
    }
  }

  // Middleware para parsear JSON
  app.use(express.json());

  // Configurar CORS
  const corsOptions = {
    origin: function (origin, callback) {
      // Lista de orígenes permitidos
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://nuri-task-app.vercel.app',
        'https://nuri-task-api.vercel.app',
      ];

      if (!origin) {
        return callback(null, true);
      }

      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
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
