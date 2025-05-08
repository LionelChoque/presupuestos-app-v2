import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuración de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para registrar mensajes de log
function log(message, source = 'server') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${source}] ${message}`);
}

// Verificar que los directorios necesarios existen
function checkDirectories() {
  const clientDir = path.join(__dirname, 'client');
  if (!fs.existsSync(clientDir)) {
    log('ADVERTENCIA: Directorio client no encontrado, creándolo...');
    fs.mkdirSync(clientDir, { recursive: true });
    
    // Crear un archivo index.html básico si no existe
    const indexPath = path.join(clientDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistema de Seguimiento de Presupuestos</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      color: white;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 20px;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sistema de Seguimiento de Presupuestos</h1>
    <p>La aplicación está siendo iniciada.<br>Por favor, espera unos momentos.</p>
  </div>
</body>
</html>
      `;
      fs.writeFileSync(indexPath, htmlContent);
      log('Archivo index.html básico creado');
    }
  }
}

// Iniciar el servidor
async function startServer() {
  try {
    // Verificar directorios
    checkDirectories();
    
    log('Iniciando servidor en modo producción...');
    
    // Crear aplicación Express
    const app = express();
    
    // Configuración básica
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // Importar módulos del servidor
    log('Cargando módulos del servidor...');
    
    // Importar las rutas de la API
    const serverRoutesModule = await import('./server/routes.js');
    const { registerRoutes } = serverRoutesModule;
    
    // Importar configuración de autenticación
    const serverAuthModule = await import('./server/auth.js');
    const { setupAuth } = serverAuthModule;
    
    // Configurar autenticación
    log('Configurando autenticación...');
    setupAuth(app);
    
    // Servir archivos estáticos del cliente
    log('Configurando archivos estáticos...');
    app.use(express.static(path.join(__dirname, 'client')));
    
    // Registrar rutas de la API
    log('Registrando rutas de la API...');
    const server = await registerRoutes(app);
    
    // Configurar ruta comodín para SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'index.html'));
    });
    
    // Manejador de errores global
    app.use((err, _req, res, _next) => {
      console.error('Error en el servidor:', err);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'production' ? null : err.message
      });
    });
    
    // Obtener puerto de las variables de entorno o usar el valor por defecto
    const PORT = process.env.PORT || 5000;
    
    // Si registerRoutes no ha iniciado el servidor, iniciarlo aquí
    if (!server.listening) {
      server.listen(PORT, '0.0.0.0', () => {
        log(`Servidor escuchando en el puerto ${PORT}`);
      });
    }
    
    log('Servidor iniciado correctamente');
    return { app, server };
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();