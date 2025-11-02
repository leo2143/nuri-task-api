import swaggerAutogen from 'swagger-autogen';

// Detectar el host durante el build
const getHost = () => {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL;
  }
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL;
  }
  return 'localhost:3000';
};

const isVercel = process.env.VERCEL === '1';

console.log('==========================================');
console.log('🚀 INICIANDO GENERACIÓN DE SWAGGER');
console.log('==========================================');
console.log('🔧 Host detectado:', getHost());
console.log('🔧 Entorno:', isVercel ? 'Vercel' : 'Local');
console.log('🔧 VERCEL:', process.env.VERCEL);
console.log('🔧 VERCEL_URL:', process.env.VERCEL_URL);
console.log('🔧 VERCEL_PROJECT_PRODUCTION_URL:', process.env.VERCEL_PROJECT_PRODUCTION_URL);
console.log('🔧 Schemes:', isVercel ? 'https' : 'http');
console.log('==========================================');

const doc = {
  info: {
    title: 'Nuri Task API',
    version: '1.0.0',
    description: 'API REST para la gestión de tareas, metas, métricas y logros personales',
  },
  host: getHost(),
  basePath: '/',
  schemes: isVercel ? ['https'] : ['http'],
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
  console.log('==========================================');
  console.log('✅ SWAGGER GENERADO EXITOSAMENTE');
  console.log('📄 Archivo:', outputFile);
  console.log('🌐 Host final:', doc.host);
  console.log('🔒 Schemes:', doc.schemes);
  console.log('==========================================');

  // Importar y ejecutar el servidor después de generar swagger (solo en dev local)
  if (!process.env.VERCEL) {
    import('./index.js');
  }
});
