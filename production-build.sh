#!/bin/bash

# Script para crear un paquete de despliegue en producción sin dependencias de Replit
echo "===== Generando paquete de despliegue para producción ====="

# Crear estructura de directorios
echo "Creando estructura de directorios..."
rm -rf production-dist
mkdir -p production-dist/client

# Copiar archivos del frontend
echo "Copiando y preparando frontend..."
cp -r client/src production-dist/client/
cp client/index.html production-dist/client/

# Crear vite.config personalizado para producción
cat > production-dist/vite.config.js << EOF
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
  },
});
EOF

# Copiar archivos del backend y shared
echo "Copiando archivos del backend y shared..."
cp -r server production-dist/
cp -r shared production-dist/

# Crear archivo server.js independiente
cat > production-dist/server.js << EOF
// Servidor de producción independiente
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuración de ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas y configuración
import { registerRoutes } from './server/routes.js';

// Crear aplicación Express
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Registrar rutas de la API
const server = createServer(app);
await registerRoutes(app);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'client/dist')));

// Ruta comodín que sirve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Servidor ejecutándose en http://0.0.0.0:\${PORT}\`);
});
EOF

# Copiar package.json y modificarlo para producción
echo "Preparando package.json para producción..."
cp package.json production-dist/

# Modificar package.json
sed -i 's/"type": "module"/"type": "module"/g' production-dist/package.json
sed -i 's/"dev":.*/"dev": "node server.js",/g' production-dist/package.json
sed -i 's/"build":.*/"build": "vite build",/g' production-dist/package.json
sed -i 's/"start":.*/"start": "node server.js",/g' production-dist/package.json

# Crear archivo .env para producción
cat > production-dist/.env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db
EOF

# Crear ecosystem.config.cjs para PM2
cat > production-dist/ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: "presupuestos-app",
    script: "server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 5000,
      DATABASE_URL: "postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db"
    },
    restart_delay: 4000,
    max_restarts: 10,
    wait_ready: false,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
EOF

# Copiar configuración de Nginx
mkdir -p production-dist/nginx
cp -r nginx/* production-dist/nginx/ 2>/dev/null || echo "No se encontró configuración de Nginx"

# Copiar scripts adicionales
cp -r db-setup.sql production-dist/ 2>/dev/null || echo "No se encontró db-setup.sql"
cp -r migrate.sh production-dist/ 2>/dev/null || echo "No se encontró migrate.sh"
cp -r attached_assets production-dist/ 2>/dev/null || echo "No se encontró carpeta attached_assets"

# Scripts para despliegue
cat > production-dist/deploy.sh << EOF
#!/bin/bash
# Script para desplegar la aplicación

# Instalar dependencias
npm install --production

# Construir el frontend
npm run build

# Iniciar con PM2
pm2 delete presupuestos-app 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "Aplicación desplegada. Verifique los logs con: pm2 logs presupuestos-app"
EOF

chmod +x production-dist/deploy.sh

echo "===== Paquete de despliegue generado en 'production-dist' ====="
echo ""
echo "Para desplegar:"
echo "1. Copia el contenido de 'production-dist/' al servidor"
echo "2. Edita .env y ecosystem.config.cjs con la contraseña correcta de la base de datos"
echo "3. Ejecuta: ./deploy.sh"
echo ""
echo "IMPORTANTE: Asegúrate de tener instalado Node.js, PM2, y PostgreSQL en el servidor"