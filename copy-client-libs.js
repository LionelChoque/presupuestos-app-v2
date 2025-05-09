// ESM compatible version of copy-client-libs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios necesarios
const targetDir = path.join(__dirname, 'dist', 'client', 'src', 'lib');
fs.mkdirSync(targetDir, { recursive: true });

// Copiar archivos de utilidades
const sourceDir = path.join(__dirname, 'client', 'src', 'lib');
const filesToCopy = ['csvParser.ts', 'types.ts', 'utils.ts'];

filesToCopy.forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const targetFile = path.join(targetDir, file.replace('.ts', '.js'));
  
  try {
    const content = fs.readFileSync(sourceFile, 'utf8');
    // Convertir imports de TypeScript a JavaScript
    const jsContent = content
      .replace(/import \{([^}]*)\} from ['"]([^'"]*)['"]/g, 'import {$1} from "$2.js"')
      .replace(/export interface/g, 'export class')
      .replace(/: [A-Za-z<>[\]|]+/g, '');
    
    fs.writeFileSync(targetFile, jsContent);
    console.log(`Copied and converted: ${file} -> ${targetFile}`);
  } catch (err) {
    console.error(`Error processing file ${file}:`, err);
  }
});
