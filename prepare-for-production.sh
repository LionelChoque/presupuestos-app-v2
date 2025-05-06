#!/bin/bash

# Script para preparar un paquete completo de producción para el despliegue en VPS
echo "===== Preparando aplicación para despliegue en producción ====="

# 1. Detener todos los procesos en segundo plano
echo "Deteniendo procesos y limpiando el puerto 5000..."
fuser -k 5000/tcp 2>/dev/null || true

# 2. Crear directorio para archivos de producción
echo "Creando directorio para archivos de producción..."
rm -rf production
mkdir -p production
mkdir -p production/client
mkdir -p production/server
mkdir -p production/shared
mkdir -p production/nginx

# 3. Copiar archivos del frontend
echo "Preparando archivos del frontend..."
cp -r client/src production/client/
cp client/index.html production/client/
cp tailwind.config.ts production/
cp postcss.config.js production/
cp tsconfig.json production/

# 4. Copiar archivos del backend
echo "Preparando archivos del backend..."
cp -r server production/

# 5. Copiar archivos compartidos
echo "Preparando archivos compartidos..."
cp -r shared production/

# 6. Copiar assets y otros archivos necesarios
echo "Copiando assets y otros archivos necesarios..."
if [ -d "attached_assets" ]; then
  cp -r attached_assets production/
  echo "✅ Assets copiados"
else
  echo "⚠️ No se encontró carpeta attached_assets (no es crítico)"
fi

if [ -d "nginx" ]; then
  cp -r nginx/* production/nginx/
  echo "✅ Configuración de Nginx copiada"
else
  echo "⚠️ No se encontró configuración de Nginx"
  # Crear una configuración Nginx básica
  cat > production/nginx/presupuestos.bairesanalitica.com.conf << EOL
server {
    listen 80;
    server_name presupuestos.bairesanalitica.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL
  echo "✅ Configuración básica de Nginx creada"
fi

# 7. Copiar scripts de base de datos
echo "Preparando scripts de base de datos..."
if [ -f "db-setup.sql" ]; then
  cp db-setup.sql production/
  echo "✅ Script db-setup.sql copiado"
else
  echo "⚠️ No se encontró db-setup.sql - creando esquema básico..."
  # Crear un esquema básico de la base de datos
  cat > production/db-setup.sql << EOL
-- Esquema básico de la base de datos presupuestos
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  empresa TEXT NOT NULL,
  fecha_creacion TEXT NOT NULL,
  fabricante TEXT NOT NULL,
  moneda TEXT,
  descuento NUMERIC(5,2),
  validez INTEGER,
  monto_total NUMERIC(15,2) NOT NULL,
  dias_restantes INTEGER NOT NULL,
  tipo_seguimiento TEXT NOT NULL,
  accion TEXT NOT NULL,
  prioridad TEXT NOT NULL,
  alertas JSONB,
  completado BOOLEAN DEFAULT FALSE,
  fecha_completado TEXT,
  estado TEXT DEFAULT 'Pendiente',
  fecha_estado TEXT,
  notas TEXT,
  finalizado BOOLEAN DEFAULT FALSE,
  fecha_finalizado TEXT,
  es_licitacion BOOLEAN DEFAULT FALSE,
  historial_etapas JSONB,
  historial_acciones JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id SERIAL PRIMARY KEY,
  budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC(15,2) NOT NULL,
  cantidad NUMERIC(15,2)
);

CREATE TABLE IF NOT EXISTS contact_info (
  id SERIAL PRIMARY KEY,
  budget_id TEXT NOT NULL UNIQUE REFERENCES budgets(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT
);

CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  archivo_csv TEXT NOT NULL,
  total_registros INTEGER NOT NULL,
  registros_agregados INTEGER NOT NULL,
  registros_actualizados INTEGER NOT NULL,
  registros_eliminados INTEGER NOT NULL
);
EOL
  echo "✅ Esquema básico db-setup.sql creado"
fi

# 8. Crear script.js independiente para producción
echo "Creando server.js para producción..."
cat > production/server.js << EOL
// Servidor de producción independiente
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear aplicación Express
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Importar rutas y configuración
import { registerRoutes } from './server/routes.js';

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'client/dist')));

// Registrar rutas de la API
const server = createServer(app);
await registerRoutes(app);

// Ruta comodín para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`Servidor ejecutándose en http://0.0.0.0:\${PORT}\`);
});
EOL

# 9. Crear package.json para producción
echo "Creando package.json para producción..."
cp package.json production/
# Asegurarse de que el tipo sea 'module'
sed -i 's/"type": "commonjs"/"type": "module"/g' production/package.json 2>/dev/null || true
# Si no tiene la propiedad type, añadirla
if ! grep -q '"type":' production/package.json; then
  sed -i '/"name"/a \ \ "type": "module",' production/package.json
fi

# 10. Crear archivo .env para producción
echo "Creando archivo .env para producción..."
cat > production/.env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db
EOL

# 11. Crear ecosystem.config.cjs para PM2
echo "Creando configuración para PM2..."
cat > production/ecosystem.config.cjs << EOL
module.exports = {
  apps: [{
    name: "presupuestos-app",
    script: "./server.js",
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
EOL

# 12. Crear scripts de despliegue y mantenimiento
echo "Creando scripts de despliegue y mantenimiento..."

# Script de despliegue
cat > production/deploy.sh << EOL
#!/bin/bash
# Script para desplegar la aplicación

echo "===== Desplegando aplicación ====="

# Instalar dependencias de producción
echo "Instalando dependencias..."
npm install --omit=dev

# Construir el frontend
echo "Construyendo el frontend..."
npx vite build

# Iniciar con PM2
echo "Iniciando aplicación con PM2..."
pm2 delete presupuestos-app 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "===== Aplicación desplegada ====="
echo "Para ver los logs: pm2 logs presupuestos-app"
EOL
chmod +x production/deploy.sh

# Script de mantenimiento
cat > production/maintenance.sh << EOL
#!/bin/bash
# Script de mantenimiento para la aplicación

function show_menu {
  clear
  echo "===== MANTENIMIENTO DE PRESUPUESTOS APP ====="
  echo "1. Ver estado de la aplicación"
  echo "2. Reiniciar aplicación"
  echo "3. Ver logs de la aplicación"
  echo "4. Ver configuración actual"
  echo "5. Hacer backup de la base de datos"
  echo "6. Restaurar backup de la base de datos"
  echo "7. Reiniciar Nginx"
  echo "8. Salir"
  echo "==========================================="
  echo -n "Selecciona una opción: "
}

function view_status {
  echo "Estado de PM2:"
  pm2 list
  echo ""
  echo "Estado de PostgreSQL:"
  sudo systemctl status postgresql | head -n 10
  echo ""
  echo "Estado de Nginx:"
  sudo systemctl status nginx | head -n 10
  echo ""
  echo "Uso de disco:"
  df -h | grep "/dev/sd"
  echo ""
  echo "Puertos en uso:"
  netstat -tulpn | grep -E ':80|:5000'
  echo ""
  read -p "Presiona Enter para continuar..."
}

function restart_app {
  echo "Reiniciando aplicación..."
  pm2 restart presupuestos-app
  echo "Aplicación reiniciada."
  read -p "Presiona Enter para continuar..."
}

function view_logs {
  echo "Mostrando logs de la aplicación..."
  pm2 logs presupuestos-app --lines 50
  read -p "Presiona Enter para continuar..."
}

function view_config {
  echo "Configuración actual:"
  echo ""
  echo "Archivo .env:"
  cat .env
  echo ""
  echo "Configuración de PM2:"
  cat ecosystem.config.cjs
  echo ""
  echo "Configuración de Nginx:"
  cat nginx/presupuestos.bairesanalitica.com.conf
  echo ""
  read -p "Presiona Enter para continuar..."
}

function backup_db {
  BACKUP_DIR="./backups"
  mkdir -p \$BACKUP_DIR
  FILENAME="presupuestos_\$(date +%Y%m%d_%H%M%S).dump"
  echo "Creando backup de la base de datos: \$FILENAME"
  pg_dump -U presupuestos_user -h localhost -d presupuestos_db -F c -f "\$BACKUP_DIR/\$FILENAME"
  if [ \$? -eq 0 ]; then
    echo "Backup creado exitosamente en \$BACKUP_DIR/\$FILENAME"
  else
    echo "Error al crear el backup"
  fi
  read -p "Presiona Enter para continuar..."
}

function restore_db {
  BACKUP_DIR="./backups"
  if [ ! -d "\$BACKUP_DIR" ]; then
    echo "No se encontró el directorio de backups"
    read -p "Presiona Enter para continuar..."
    return
  fi
  
  echo "Archivos de backup disponibles:"
  ls -lh \$BACKUP_DIR
  echo ""
  read -p "Ingresa el nombre del archivo de backup a restaurar: " FILENAME
  
  if [ ! -f "\$BACKUP_DIR/\$FILENAME" ]; then
    echo "El archivo \$BACKUP_DIR/\$FILENAME no existe"
    read -p "Presiona Enter para continuar..."
    return
  fi
  
  echo "¡ADVERTENCIA! Esto sobrescribirá la base de datos actual."
  read -p "¿Estás seguro de que deseas continuar? (s/n): " CONFIRM
  
  if [ "\$CONFIRM" == "s" ]; then
    echo "Restaurando backup..."
    pg_restore -U presupuestos_user -h localhost -d presupuestos_db -c -F c "\$BACKUP_DIR/\$FILENAME"
    if [ \$? -eq 0 ]; then
      echo "Backup restaurado exitosamente"
    else
      echo "Error al restaurar el backup"
    fi
  else
    echo "Operación cancelada"
  fi
  
  read -p "Presiona Enter para continuar..."
}

function restart_nginx {
  echo "Verificando configuración de Nginx..."
  sudo nginx -t
  if [ \$? -eq 0 ]; then
    echo "Reiniciando Nginx..."
    sudo systemctl restart nginx
    echo "Nginx reiniciado."
  else
    echo "Error en la configuración de Nginx. No se reinició."
  fi
  read -p "Presiona Enter para continuar..."
}

# Menú principal
while true; do
  show_menu
  read OPTION
  
  case \$OPTION in
    1) view_status ;;
    2) restart_app ;;
    3) view_logs ;;
    4) view_config ;;
    5) backup_db ;;
    6) restore_db ;;
    7) restart_nginx ;;
    8) break ;;
    *) echo "Opción inválida" ;;
  esac
done

echo "Saliendo del programa de mantenimiento"
exit 0
EOL
chmod +x production/maintenance.sh

# 13. Crear un archivo README.md con instrucciones
echo "Creando README.md con instrucciones..."
cat > production/README.md << EOL
# Sistema de Seguimiento de Presupuestos - Despliegue en Producción

## Requisitos previos

- Node.js 18.x o superior
- PostgreSQL 12 o superior
- PM2 (instalado globalmente)
- Nginx

## Instalación

1. **Configurar la base de datos:**

\`\`\`bash
# Crear base de datos y usuario
sudo -u postgres psql -c "CREATE DATABASE presupuestos_db;"
sudo -u postgres psql -c "CREATE USER presupuestos_user WITH ENCRYPTED PASSWORD 'tu_contraseña_segura';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE presupuestos_db TO presupuestos_user;"

# Importar esquema
sudo -u postgres psql presupuestos_db < db-setup.sql
\`\`\`

2. **Actualizar credenciales:**

Edita los archivos \`.env\` y \`ecosystem.config.cjs\` para establecer la contraseña correcta de la base de datos.

3. **Desplegar la aplicación:**

\`\`\`bash
# Instalar dependencias y construir la aplicación
./deploy.sh
\`\`\`

4. **Configurar Nginx:**

\`\`\`bash
# Copiar archivo de configuración
sudo cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
\`\`\`

5. **Configurar SSL (opcional pero recomendado):**

\`\`\`bash
sudo certbot --nginx -d presupuestos.bairesanalitica.com
\`\`\`

## Mantenimiento

Para tareas de mantenimiento, use el script \`maintenance.sh\`:

\`\`\`bash
./maintenance.sh
\`\`\`

Este script proporciona opciones para:

- Ver el estado de la aplicación
- Reiniciar la aplicación
- Ver logs
- Hacer backups de la base de datos
- Restaurar backups
- Reiniciar Nginx

## Solución de problemas

Si la aplicación no responde o muestra errores:

1. Verificar logs: \`pm2 logs presupuestos-app\`
2. Verificar estado: \`pm2 list\`
3. Reiniciar aplicación: \`pm2 restart presupuestos-app\`
4. Verificar conexión a base de datos: \`psql -U presupuestos_user -h localhost -d presupuestos_db -c "SELECT 1;"\`
EOL

# 14. Crear un archivo .gitignore
echo "Creando .gitignore..."
cat > production/.gitignore << EOL
node_modules/
.env
backups/
EOL

# 15. Crear un script para empaquetar todo y transferirlo al servidor
echo "Creando script para empaquetar y transferir..."
cat > package-for-server.sh << EOL
#!/bin/bash
# Script para empaquetar todo y transferirlo al servidor

# Crear el tarball
echo "Creando archivo comprimido..."
cd production
tar -czf ../presupuestos-deploy.tar.gz .
cd ..

echo "===== Paquete creado: presupuestos-deploy.tar.gz ====="
echo ""
echo "Para transferir al servidor:"
echo "scp presupuestos-deploy.tar.gz baires@168.231.99.16:/home/baires/"
echo ""
echo "Para desplegar en el servidor:"
echo "ssh baires@168.231.99.16"
echo "cd /home/baires/apps/presupuestos"
echo "tar -xzf /home/baires/presupuestos-deploy.tar.gz ."
echo "chmod +x deploy.sh"
echo "./deploy.sh"
EOL
chmod +x package-for-server.sh

echo "===== Preparación completada ====="
echo ""
echo "Todos los archivos necesarios están en el directorio 'production'"
echo ""
echo "Para empaquetar y preparar para transferencia:"
echo "./package-for-server.sh"
echo ""
echo "IMPORTANTE: Asegúrate de revisar y ajustar los archivos según sea necesario antes de desplegar"