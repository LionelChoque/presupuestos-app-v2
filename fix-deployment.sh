#!/bin/bash

# Script para corregir problemas comunes de despliegue
echo "===== Corrigiendo problemas de despliegue ====="

# Verificar directorio actual
CURRENT_DIR=$(pwd)
echo "Directorio actual: $CURRENT_DIR"

# Asegurarse de que estamos en el directorio correcto
if [[ "$CURRENT_DIR" != *"/home/baires/apps/presupuestos"* ]]; then
  echo "⚠️ Este script debe ejecutarse desde el directorio /home/baires/apps/presupuestos"
  echo "Por favor, cambia al directorio correcto e intenta nuevamente"
  exit 1
fi

# Verificar y crear archivo .env si no existe
if [ ! -f ".env" ]; then
  echo "Creando archivo .env..."
  cat > .env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db
EOL
  echo "✅ Archivo .env creado"
else
  echo "✅ Archivo .env ya existe"
fi

# Verificar si tenemos el archivo de build index.js
if [ ! -f "index.js" ]; then
  echo "⚠️ No se encontró el archivo index.js (build de producción)"
  echo "Buscando archivos de build disponibles..."
  
  # Buscar cualquier archivo JS en el directorio
  JS_FILES=$(find . -maxdepth 1 -name "*.js" | sort)
  
  if [ -z "$JS_FILES" ]; then
    echo "❌ No se encontraron archivos JavaScript en el directorio. Por favor, ejecuta npm run build"
    exit 1
  else
    echo "Se encontraron los siguientes archivos JavaScript:"
    echo "$JS_FILES"
    
    # Elegir el primer archivo como candidato principal
    MAIN_FILE=$(echo "$JS_FILES" | head -n 1)
    echo "Usando $MAIN_FILE como archivo principal..."
    
    # Crear una copia con el nombre index.js
    cp "$MAIN_FILE" index.js
    echo "✅ Copiado $MAIN_FILE a index.js"
  fi
fi

# Asegurarse de que package.json tiene la configuración correcta
if grep -q "\"type\": \"module\"" package.json; then
  echo "Actualizando package.json para producción..."
  sed -i 's/"type": "module"/"type": "commonjs"/g' package.json
  echo "✅ package.json actualizado para modo commonjs"
fi

# Asegurarse de que exista ecosystem.config.cjs
if [ ! -f "ecosystem.config.cjs" ]; then
  echo "Creando ecosystem.config.cjs..."
  cat > ecosystem.config.cjs << EOL
module.exports = {
  apps: [{
    name: 'presupuestos-app',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db'
    },
    restart_delay: 4000,
    max_restarts: 10,
    wait_ready: false,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
EOL
  echo "✅ Archivo ecosystem.config.cjs creado"
fi

# Detener PM2 y limpiar logs
echo "Deteniendo procesos PM2 previos..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Liberar memoria
echo "Liberando memoria del sistema..."
sudo sync && sudo echo 3 | sudo tee /proc/sys/vm/drop_caches

# Asegurarse de que las dependencias están instaladas
echo "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install --production
fi

# Iniciar la aplicación con PM2
echo "Iniciando aplicación con PM2..."
NODE_ENV=production pm2 start ecosystem.config.cjs

# Guardar configuración de PM2
echo "Guardando configuración de PM2..."
pm2 save

# Verificar estado
echo "Verificando estado de la aplicación..."
pm2 list

# Verificar puerto
echo "Verificando puerto 5000..."
netstat -tulpn 2>/dev/null | grep :5000 || echo "⚠️ No se detecta aplicación escuchando en puerto 5000"

echo "===== Correcciones completadas ====="
echo "Para ver los logs de la aplicación ejecuta: pm2 logs presupuestos-app"
echo "Para reiniciar Nginx ejecuta: sudo systemctl restart nginx"