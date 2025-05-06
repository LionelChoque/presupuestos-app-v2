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

# Ejecutar script de instalación en el servidor
echo "=== Configurando la aplicación en el servidor ==="
ssh ${USER}@${SERVER} "cd ${DEST_PATH} && sudo ./install.sh"

# Mensaje final
echo "=== Despliegue completado ==="
echo "IMPORTANTE: Recuerde modificar la contraseña de la base de datos en ecosystem.config.js"
echo "y luego iniciar la aplicación con: pm2 start ecosystem.config.js"
echo ""
echo "Para acceder a la aplicación, visite: http://presupuestos.bairesanalitica.com"