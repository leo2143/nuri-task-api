import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Nuri Task API',
    version: '1.0.0',
    description: 'API REST para la gestión de tareas, metas, métricas y logros personales',
  },
  host: process.env.VERCEL_URL || 'localhost:3000',
  basePath: '/',
  schemes: process.env.VERCEL_URL ? ['https'] : ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    { name: 'Users', description: 'Gestión de usuarios y autenticación' },
    { name: 'Todos', description: 'Gestión de tareas' },
    { name: 'Goals', description: 'Gestión de metas' },
    { name: 'Metrics', description: 'Métricas de progreso' },
    { name: 'Moodboards', description: 'Gestión de tableros de inspiración' },
    { name: 'Achievements', description: 'Gestión de logros (solo admin)' },
    { name: 'User Achievements', description: 'Progreso personal de logros' },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Token JWT en formato: Bearer {token}',
    },
  },
};

const outputFile = './swagger_output.json';
const endpointsFiles = [
  './routes/routes.js',
  './controllers/todos/routes.js',
  './controllers/users/routes.js',
  './controllers/goals/routes.js',
  './controllers/metrics/routes.js',
  './controllers/moodboard/routes.js',
  './controllers/achievements/routes.js',
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Documentación Swagger generada correctamente');
});
