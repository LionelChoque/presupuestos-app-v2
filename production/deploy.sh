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
