#!/bin/bash

# Construir frontend
echo "Construyendo la aplicación frontend..."
npm run build

# Crear dirección para la aplicación en producción
echo "Preparando archivos para producción..."
mkdir -p dist

# Copiar archivos necesarios
cp -r client/dist dist/client
cp -r server dist/
cp -r shared dist/
cp package.json dist/
cp package-lock.json dist/
cp ecosystem.config.js dist/
cp -r nginx dist/

echo "Construcción completa. Los archivos de producción están en el directorio 'dist/'."