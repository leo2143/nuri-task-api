import express from 'express';
import chalk from 'chalk';
import mongoose from 'mongoose';

// Configuración del servidor
export const createServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI;

  //Mongoose connecting
  mongoose.connect(MONGO_URI, {});
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log(chalk.green('🔗 Conexión a MongoDB establecida'));
  });

  // Middleware para parsear JSON
  app.use(express.json());

  // Servir archivos estáticos desde la carpeta public
  app.use(express.static('public'));

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
