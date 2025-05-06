#!/bin/bash

# Script de instalación para el servidor de producción
echo "Iniciando instalación del sistema de presupuestos..."

# Actualizar el sistema
echo "Actualizando paquetes del sistema..."
sudo apt update
sudo apt upgrade -y

# Instalar dependencias necesarias
echo "Instalando dependencias..."
sudo apt install -y nginx postgresql postgresql-contrib nodejs npm curl

# Instalar PM2 globalmente
echo "Instalando PM2 para gestión de procesos..."
sudo npm install -pm2 -g

# Configuración de Nginx
echo "Configurando Nginx..."
sudo cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configuración de base de datos
echo "Configurando base de datos PostgreSQL..."
sudo -u postgres psql -f db-setup.sql

echo "Instalación completada. Ahora ejecuta 'npm install' para instalar las dependencias de la aplicación."