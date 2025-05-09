// deploy-server.js
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

// Configuración de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar rutas de la API y configuración
async function startServer() {
  try {
    // Crear aplicación Express
    const app = express();

    // Configuración básica
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Configurar registro de solicitudes HTTP
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      
      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          console.log(logLine);
        }
      });
      
      next();
    });

    // Importar y configurar autenticación
    const { setupAuth } = await import('./dist/server/auth.js');
    setupAuth(app);

    // Servir archivos estáticos del cliente
    app.use(express.static(path.join(__dirname, 'dist/public')));

    // Importar las rutas de la API
    const { registerRoutes } = await import('./dist/server/routes.js');
    const server = await registerRoutes(app);

    // Configurar ruta comodín para SPA
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
    });

    // Manejador de errores global
    app.use((err, _req, res, _next) => {
      console.error(err);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'production' ? null : err.message
      });
    });

    // Obtener puerto de las variables de entorno o usar el valor por defecto
    const PORT = process.env.PORT || 5000;

    // Si registerRoutes no ha iniciado el servidor, iniciarlo aquí
    if (!server) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor en modo producción escuchando en el puerto ${PORT}`);
      });
    }

    return { app, server };
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
