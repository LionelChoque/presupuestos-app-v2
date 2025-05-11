#!/bin/bash

# Script para construir la aplicación para producción con ESM
echo "Iniciando construcción para producción con ESM..."

# Construir el frontend
echo "Construyendo el frontend..."
./build-frontend.sh

# Compilar servidor (TypeScript a ESM)
echo "Compilando el servidor con ESM..."
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Crear carpeta de producción
echo "Empaquetando archivos para despliegue..."
mkdir -p dist/prod
cp -r dist/index.js dist/prod/server.js
cp -r client/dist dist/prod/client
cp package.json dist/prod/
cp package-lock.json dist/prod/
cp ecosystem.config.esm.js dist/prod/ecosystem.config.js

# Crear el archivo tar.gz
echo "Creando archivo de despliegue..."
tar -czf presupuestos-deploy-esm.tar.gz -C dist/prod .

echo "Construcción completada. El archivo presupuestos-deploy-esm.tar.gz está listo para ser desplegado."
echo "Para desplegar en el servidor:"
echo "1. Transfiere el archivo: scp presupuestos-deploy-esm.tar.gz usuario@servidor:/ruta/destino/"
echo "2. Extrae el archivo: tar -xzf presupuestos-deploy-esm.tar.gz"
echo "3. Instala dependencias: npm ci --production"
echo "4. Inicia la aplicación: pm2 start ecosystem.config.js"