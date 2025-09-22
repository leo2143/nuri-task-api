import express from 'express';
import chalk from 'chalk';
import mongoose from 'mongoose';

// Configuración del servidor
export const createServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI;


  //Mongoose connecting
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log(chalk.green('🔗 Conexión a MongoDB establecida'));
  });

  // Middleware para parsear JSON
  app.use(express.json());


  return { app, PORT };
};

// Función para iniciar el servidor
export const startServer = (app, PORT) => {
    app.listen(PORT, () => {
        console.log(chalk.cyan(`
        
                                        TODO LIST API  
                                       ....
                             ,''. :   __
                                 \\|_.'  \`:       _.----._//_
                                .'  .'.\`'-._   .'  _/ -._ \\)-.----O
                               '._.'.'      '--''-'._   '--..--'-\`
                                .'.'___    /\`'---'. / ,-'\`
    Iniciando servidor...      _<__.-._))../ /'----'/.'_____:'.
                       \\_    :            \\ ]              :  '.
                         \\___:             \\\\              :    '.  http://localhost:${PORT}   
                             :              \\\\__           :    .'
                             :_______________|__]__________:  .'
                                        .' __ '.           :.'
                                      .' .'  '. '.
                                    .' .'      '. '.
                                  .' .'          '. '.
                               _.' .'______________'. '._
                              [_0______________________0_]

            `));
        console.log(chalk.green(`🚀 Servidor corriendo en http://localhost:${PORT}`));
        console.log(chalk.yellow('📝 Endpoints disponibles:'));
        console.log(chalk.cyan('  GET    /api/todos      - Obtener todas las tareas'));
        console.log(chalk.cyan('  GET    /api/todos/:id  - Obtener una tarea específica'));
        console.log(chalk.cyan('  POST   /api/todos      - Crear una nueva tarea'));
        console.log(chalk.cyan('  PUT    /api/todos/:id  - Actualizar una tarea'));
        console.log(chalk.cyan('  DELETE /api/todos/:id  - Eliminar una tarea'));
    });
};
