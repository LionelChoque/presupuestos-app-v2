#!/bin/bash

# Script para construir la aplicación para producción con CommonJS
echo "Iniciando construcción para producción con CommonJS..."

# Construir el frontend
echo "Construyendo el frontend..."
./build-frontend.sh

# Compilar servidor (TypeScript a CommonJS)
echo "Compilando el servidor a CommonJS..."
npx tsc --project tsconfig.prod.json

# Crear carpeta de producción
echo "Empaquetando archivos para despliegue..."
mkdir -p dist/prod
cp -r dist/server dist/prod/
cp -r dist/shared dist/prod/
cp -r client/dist dist/prod/client
cp package.json dist/prod/
cp package-lock.json dist/prod/
cp ecosystem.config.js dist/prod/
cp MEJORAS_PRODUCCION.md dist/prod/

# Actualizar el path en ecosystem.config.js para el directorio de producción
echo "Ajustando configuración para PM2..."
sed -i 's|dist/server/index.js|server/index.js|g' dist/prod/ecosystem.config.js

# Crear el archivo tar.gz
echo "Creando archivo de despliegue..."
tar -czf presupuestos-deploy.tar.gz -C dist/prod .

echo "Construcción completada. El archivo presupuestos-deploy.tar.gz está listo para ser desplegado."
echo "Para desplegar en el servidor:"
echo "1. Transfiere el archivo: scp presupuestos-deploy.tar.gz usuario@servidor:/ruta/destino/"
echo "2. Extrae el archivo: tar -xzf presupuestos-deploy.tar.gz"
echo "3. Instala dependencias: npm ci --production"
echo "4. Inicia la aplicación: pm2 start ecosystem.config.js"