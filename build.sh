#!/bin/bash

# Construir la aplicación
echo "Construyendo la aplicación para producción..."
NODE_ENV=production npm run build

# Crear directorio para la aplicación en producción
echo "Preparando archivos para producción..."
mkdir -p dist/deploy

# Copiar archivos necesarios
echo "Copiando archivos a la carpeta de despliegue..."
cp -r client/dist dist/deploy/
cp -r dist/*.js dist/deploy/
cp package.json dist/deploy/
cp package-lock.json dist/deploy/
cp ecosystem.config.js dist/deploy/
cp ecosystem.config.cjs dist/deploy/
cp -r nginx dist/deploy/
cp db-setup.sql dist/deploy/
cp migrate.sh dist/deploy/
cp install-server.sh dist/deploy/
cp import-data.sh dist/deploy/
cp check-service.sh dist/deploy/
cp fix-deployment.sh dist/deploy/
cp README.md dist/deploy/
cp -r attached_assets dist/deploy/

# Crear un archivo .env para producción
echo "Generando archivo .env para producción..."
cat > dist/deploy/.env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db
EOL

echo "Construcción completa. Los archivos de producción están en el directorio 'dist/deploy/'."
echo "Para desplegar, transfiere estos archivos al servidor usando:"
echo "scp -r dist/deploy/* baires@168.231.99.16:/home/baires/apps/presupuestos/"