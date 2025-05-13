#!/bin/bash

# Script para construir la aplicación para producción con ESM
echo "Iniciando construcción para producción..."

# Construir el frontend
echo "Construyendo el frontend..."
npx vite build

# Compilar servidor (TypeScript a ESM)
echo "Compilando el servidor..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Construcción completada. Para iniciar la aplicación en producción:"
echo "NODE_ENV=production node --experimental-specifier-resolution=node dist/index.js"