import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swaggerUiDir = join(__dirname, 'public', 'swagger-ui');

// Crear directorio si no existe
mkdirSync(swaggerUiDir, { recursive: true });

const files = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-32x32.png',
  'favicon-16x16.png',
];

const baseUrl = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        if (response.statusCode === 200) {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => {
            writeFileSync(dest, Buffer.concat(chunks));
            console.log(`✅ Descargado: ${dest}`);
            resolve();
          });
        } else {
          reject(new Error(`Error ${response.statusCode}: ${url}`));
        }
      })
      .on('error', reject);
  });
}

async function downloadAll() {
  console.log('📥 Descargando archivos de Swagger UI...\n');

  for (const file of files) {
    try {
      await downloadFile(baseUrl + file, join(swaggerUiDir, file));
    } catch (error) {
      console.error(`❌ Error descargando ${file}:`, error.message);
    }
  }

  console.log('\n✅ Todos los archivos descargados correctamente');
}

downloadAll();
