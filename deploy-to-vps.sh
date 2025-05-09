#!/bin/bash

# Script para desplegar la aplicación en el VPS
# Uso: ./deploy-to-vps.sh <usuario> <servidor> <ruta_destino>

# Verificar parámetros
if [ "$#" -ne 3 ]; then
    echo "Uso: $0 <usuario> <servidor> <ruta_destino>"
    echo "Ejemplo: $0 baires 168.231.99.16 /home/baires/apps/presupuestos"
    exit 1
fi

USER=$1
SERVER=$2
DEST_PATH=$3

# Primero construir la aplicación para producción
echo "=== Construyendo la aplicación para producción ==="
./build-prod.sh

# Verificar que la construcción fue exitosa
if [ ! -d "dist" ]; then
    echo "Error: La construcción falló, no se encontró el directorio dist/"
    exit 1
fi

# Crear el directorio en el servidor si no existe
echo "=== Creando directorios en el servidor ==="
ssh ${USER}@${SERVER} "mkdir -p ${DEST_PATH}"

# Transferir archivos al servidor
echo "=== Transfiriendo archivos al servidor ==="
rsync -avz --progress dist/ ${USER}@${SERVER}:${DEST_PATH}/

# Preguntar si desea detener la aplicación actual
echo "=== ¿Desea detener la aplicación actual si está en ejecución? (s/n) ==="
read STOP_APP
if [ "$STOP_APP" = "s" ]; then
    ssh ${USER}@${SERVER} "cd ${DEST_PATH} && pm2 stop presupuestos-app || true"
fi

# Instalar dependencias
echo "=== Instalando dependencias en el servidor ==="
ssh ${USER}@${SERVER} "cd ${DEST_PATH} && npm install --omit=dev"

# Preguntar si desea configurar la base de datos
echo "=== ¿Desea configurar la base de datos? (s/n) ==="
read SETUP_DB
if [ "$SETUP_DB" = "s" ]; then
    ssh ${USER}@${SERVER} "cd ${DEST_PATH} && sudo -u postgres psql -f db-setup.sql"
fi

# Preguntar si desea configurar Nginx
echo "=== ¿Desea configurar Nginx? (s/n) ==="
read SETUP_NGINX
if [ "$SETUP_NGINX" = "s" ]; then
    ssh ${USER}@${SERVER} "cd ${DEST_PATH} && sudo cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/ && sudo ln -sf /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl restart nginx"
fi

# Preguntar si desea ejecutar migraciones de base de datos
echo "=== ¿Desea ejecutar migraciones de base de datos? (s/n) ==="
read RUN_MIGRATIONS
if [ "$RUN_MIGRATIONS" = "s" ]; then
    ssh ${USER}@${SERVER} "cd ${DEST_PATH} && ./migrate.sh"
fi

# Preguntar si desea iniciar la aplicación
echo "=== ¿Desea iniciar la aplicación con PM2? (s/n) ==="
read START_APP
if [ "$START_APP" = "s" ]; then
    ssh ${USER}@${SERVER} "cd ${DEST_PATH} && pm2 start ecosystem.config.cjs"
fi

# Mensaje final
echo "=== Despliegue completado ==="
echo "Para acceder a la aplicación, visite: https://presupuestos.bairesanalitica.com"
echo ""
echo "Para verificar el estado de la aplicación, ejecute:"
echo "ssh ${USER}@${SERVER} 'cd ${DEST_PATH} && pm2 status'"
echo ""
echo "Para ver los logs de la aplicación, ejecute:"
echo "ssh ${USER}@${SERVER} 'cd ${DEST_PATH} && pm2 logs presupuestos-app'"
