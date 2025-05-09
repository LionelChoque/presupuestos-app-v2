#!/bin/bash

echo "=== Iniciando construcción de la aplicación para producción ==="

# Ejecutar script para corregir problemas de TypeScript
echo "Ejecutando correcciones de TypeScript..."
chmod +x ./fix-typescript.sh
./fix-typescript.sh

# Limpiar directorios de salida previos
echo "Limpiando directorios anteriores..."
rm -rf dist
mkdir -p dist/public

# Paso 1: Construir el frontend con Vite
echo "=== Construyendo el frontend ==="
npm run build

# Paso 2: Transpilación de TypeScript a JavaScript para el servidor
echo "=== Transpilando TypeScript a JavaScript ==="
npx tsc -p tsconfig.prod.json

# Paso 3: Corregir importaciones para ES Modules
echo "=== Corrigiendo imports para ES Modules ==="
# Primero eliminar cualquier .js que ya exista en las importaciones para evitar duplicación
find dist -name "*.js" -exec sed -i 's/from "\.\(.*\)\.js"/from ".\1"/g' {} \;
find dist -name "*.js" -exec sed -i 's/from "\.\.\(.*\)\.js"/from "..\1"/g' {} \;
find dist -name "*.js" -exec sed -i 's/from "@shared\/\(.*\)\.js"/from "@shared\/\1"/g' {} \;

# Luego añadir la extensión .js correctamente
find dist/server -name "*.js" -exec sed -i 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} \;
find dist/server -name "*.js" -exec sed -i 's/from "\.\.\([^"]*\)"/from "..\1.js"/g' {} \;
find dist/server -name "*.js" -exec sed -i 's/from "@shared\/\([^"]*\)"/from "..\/shared\/\1.js"/g' {} \;
find dist/shared -name "*.js" -exec sed -i 's/from "\.\([^"]*\)"/from ".\1.js"/g' {} \;

# Corregir rutas específicas problemáticas
find dist -name "*.js" -exec sed -i 's/csvParser\.js\.js/csvParser.js/g' {} \;
find dist -name "*.js" -exec sed -i 's/\.\.\/client\/src/..\/dist\/client\/src/g' {} \;

# Paso 4: Copiar archivos estáticos y configuraciones
echo "=== Copiando archivos adicionales ==="
cp package.json dist/
cp ecosystem.config.cjs dist/
cp deploy-server.js dist/
cp -r nginx dist/
cp db-setup.sql dist/
cp migrate.sh dist/
cp import-data.sh dist/
chmod +x dist/migrate.sh
chmod +x dist/import-data.sh
mkdir -p dist/attached_assets
cp -r attached_assets/* dist/attached_assets/ 2>/dev/null || :

# Paso 5: Generar archivo de variables de entorno para desarrollo
echo "=== Creando archivo .env para configuración de base de datos ==="
cat > dist/.env << EOF
# Configuración de la base de datos
DATABASE_URL=postgresql://presupuestos_user:Baires2025@localhost:5432/presupuestos_db
SESSION_SECRET=presupuestos_secret_key_change_this_in_production
EOF

# Después de la transpilación de TypeScript
echo "=== Copiando archivos de cliente necesarios ==="
node copy-client-libs.js

# Paso 6: Crear script de instalación para el servidor
echo "=== Creando script de instalación ==="
cat > dist/install.sh << 'EOF'
#!/bin/bash

# Script de instalación para Sistema de Seguimiento de Presupuestos
echo "=== Instalando Sistema de Seguimiento de Presupuestos ==="

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
  echo "Este script debe ejecutarse como root o con sudo"
  exit 1
fi

# Instalar dependencias del sistema
echo "Instalando dependencias del sistema..."
apt update
apt install -y nginx postgresql postgresql-contrib nodejs npm

# Instalar PM2 globalmente
echo "Instalando PM2..."
npm install -g pm2

# Configurar la base de datos
echo "Configurando la base de datos (presione Ctrl+C si ya está configurada)..."
su - postgres -c "psql -f $(pwd)/db-setup.sql"

# Instalar dependencias de Node.js
echo "Instalando dependencias de Node.js..."
npm install --omit=dev

# Configurar Nginx
echo "Configurando Nginx..."
cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Crear enlace simbólico si es necesario para compatibilidad de rutas
if [ ! -e "/var/www/presupuestos.bairesanalitica.com" ] && [ -d "/var/www/presupuestos" ]; then
  ln -sf /var/www/presupuestos /var/www/presupuestos.bairesanalitica.com
fi

echo "=== Instalación completada ==="
echo "Para iniciar la aplicación, ejecute: pm2 start ecosystem.config.cjs"
EOF

chmod +x dist/install.sh

echo "=== Construcción completada con éxito ==="
echo "Los archivos para producción están disponibles en el directorio './dist/'"
echo "Para desplegar, use el script deploy-to-vps.sh"
