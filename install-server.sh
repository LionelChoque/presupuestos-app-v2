#!/bin/bash

# Script de instalación para el servidor de producción
echo "===== Iniciando instalación del sistema de presupuestos ====="

# Verificar si se ejecuta como root o con sudo
if [ "$EUID" -ne 0 ]; then
  echo "Este script debe ejecutarse con privilegios de root (usa sudo)"
  exit 1
fi

# Crear estructura de directorios si no existe
echo "Preparando estructura de directorios..."
APPDIR="/home/baires/apps/presupuestos"
mkdir -p $APPDIR/logs

# Actualizar el sistema
echo "Actualizando paquetes del sistema..."
apt update
apt upgrade -y

# Instalar dependencias necesarias
echo "Instalando dependencias..."
apt install -y nginx postgresql postgresql-contrib nodejs npm curl net-tools

# Instalar/actualizar Node.js a última versión LTS
echo "Configurando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 globalmente
echo "Instalando PM2 para gestión de procesos..."
npm install pm2 -g

# Crear directorio para logs de Nginx
echo "Configurando directorios de logs..."
mkdir -p /var/log/nginx/presupuestos

# Configuración de Nginx
echo "Configurando Nginx..."
cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "Reiniciando Nginx..."
systemctl restart nginx

# Configuración de base de datos
echo "Configurando base de datos PostgreSQL..."
su - postgres -c "psql -f $(pwd)/db-setup.sql"

# Verificar instalación
echo "===== Verificando instalación ====="
echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"
echo "PM2: $(pm2 -v)"
echo "Nginx: $(nginx -v)"
echo "PostgreSQL: $(su - postgres -c "psql -V")"

echo "===== Instalación completada ====="
echo "Ahora ejecuta los siguientes comandos para finalizar la configuración:"
echo "1. cd $APPDIR"
echo "2. npm install --production"
echo "3. Edita el archivo .env y ecosystem.config.js para configurar la contraseña de base de datos"
echo "4. pm2 start ecosystem.config.js"
echo "5. pm2 startup && pm2 save"