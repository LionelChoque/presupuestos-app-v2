import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { log } from './vite';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';

// Cargar variables de entorno
dotenv.config();

async function main() {
  const app: Express = express();
  const port = process.env.PORT || 5000;

  // Habilitar CORS y JSON con límites aumentados
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configurar autenticación
  setupAuth(app);

  // Middleware para registrar las peticiones API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      log(`${req.method} ${req.path}`, 'express-api');
    }
    next();
  });

  // Configurar rutas
  const server = await registerRoutes(app);

  // Manejo global de errores
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    log(`Error: ${err.message}`, 'express-error');
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  });

  // En modo producción, servir los archivos estáticos
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '..', '..', 'client')));
    
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '..', '..', 'client', 'index.html'));
    });

    // Iniciar el servidor HTTP
    server.listen(port, () => {
      console.log(`Server running in production mode on port ${port}`);
    });
  } else {
    // En desarrollo, usar Vite
    if (process.env.NODE_ENV === 'development') {
      const { setupVite } = require('./vite');
      // Vite se encarga de servir los archivos estáticos en desarrollo
      setupVite(app, server);
    }

    // Iniciar el servidor HTTP
    server.listen(port, () => {
      log(`serving on port ${port}`, 'express');
    });
  }
}

main().catch(error => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});

// Para gestión de señales y cierre limpio
process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT, cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM, cerrando servidor...');
  process.exit(0);
});

// Re-exportar para compatibilidad
module.exports = main;