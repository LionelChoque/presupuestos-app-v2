#!/bin/bash

# Script para desplegar la aplicación a un VPS
# Uso: ./deploy-to-vps.sh usuario@ip_del_servidor ruta_destino

if [ $# -lt 2 ]; then
  echo "Uso: ./deploy-to-vps.sh usuario@ip_del_servidor ruta_destino"
  echo "Ejemplo: ./deploy-to-vps.sh ubuntu@12.34.56.78 /var/www/presupuestos.bairesanalitica.com"
  exit 1
fi

SERVER=$1
DEST_PATH=$2
APP_NAME="presupuestos-app"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ARCHIVE_NAME="${APP_NAME}-${TIMESTAMP}.tar.gz"

echo "=== Iniciando despliegue de $APP_NAME a $SERVER:$DEST_PATH ==="

# Paso 1: Ejecutar build de producción
echo "Ejecutando build de producción..."
./build-prod.sh

if [ $? -ne 0 ]; then
  echo "Error en el build. Abortando despliegue."
  exit 1
fi

# Paso 2: Crear archivo comprimido
echo "Creando archivo comprimido para transferencia..."
tar -czf $ARCHIVE_NAME -C dist .

# Paso 3: Verificar si existe el directorio destino, si no, crearlo
echo "Verificando directorio destino en el servidor..."
ssh $SERVER "mkdir -p $DEST_PATH"

# Paso 4: Transferir archivo al servidor
echo "Transfiriendo archivo al servidor..."
scp $ARCHIVE_NAME $SERVER:$DEST_PATH/

# Paso 5: Descomprimir y configurar en el servidor
echo "Descomprimiendo y configurando en el servidor..."
ssh $SERVER "cd $DEST_PATH && \
  tar -xzf $ARCHIVE_NAME && \
  rm $ARCHIVE_NAME && \
  chmod +x *.sh && \
  npm install --omit=dev"

# Paso 6: Configurar Nginx (si es necesario)
echo "Configurando Nginx..."
ssh $SERVER "sudo cp $DEST_PATH/config/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/ && \
  sudo ln -sf /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/ && \
  sudo nginx -t && \
  sudo systemctl restart nginx"

# Paso 7: Configurar PM2 para iniciar la aplicación
echo "Configurando PM2..."
ssh $SERVER "cd $DEST_PATH && \
  pm2 stop $APP_NAME || true && \
  pm2 delete $APP_NAME || true && \
  pm2 start ecosystem.config.js && \
  pm2 save"

echo "=== Despliegue completado con éxito ==="
echo "La aplicación está desplegada en $SERVER:$DEST_PATH"
echo "Para verificar el estado, ejecute: ssh $SERVER \"pm2 status\""

# Limpieza local
rm $ARCHIVE_NAME

exit 0