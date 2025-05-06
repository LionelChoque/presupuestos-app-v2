#!/bin/bash

# Script para crear un paquete de despliegue sin necesidad de construir
echo "Creando paquete de despliegue para producción..."

# Determinar si estamos en entorno de desarrollo o servidor
if [ ! -d "client/dist" ] || [ ! -d "dist" ]; then
  echo "⚠️ No se encontraron los archivos compilados (client/dist o dist)"
  echo "Este script debe ejecutarse DESPUÉS de construir la aplicación en entorno de desarrollo"
  echo "Ejecuta primero: npm run build"
  exit 1
fi

# Crear directorio para el paquete de despliegue
echo "Preparando archivos para producción..."
rm -rf deployment-package
mkdir -p deployment-package

# Copiar archivos compilados
echo "Copiando archivos compilados..."
cp -r client/dist deployment-package/
cp -r dist/*.js deployment-package/

# Copiar archivos de configuración
echo "Copiando archivos de configuración..."
cp package.json deployment-package/
cp package-lock.json deployment-package/
cp ecosystem.config.js deployment-package/
cp ecosystem.config.cjs deployment-package/
cp -r nginx deployment-package/
cp db-setup.sql deployment-package/
cp migrate.sh deployment-package/
cp install-server.sh deployment-package/
cp import-data.sh deployment-package/
cp check-service.sh deployment-package/
cp fix-deployment.sh deployment-package/
cp README.md deployment-package/
cp -r attached_assets deployment-package/ 2>/dev/null || echo "Nota: No se encontró la carpeta attached_assets"

# Crear un archivo .env para producción
echo "Generando archivo .env para producción..."
cat > deployment-package/.env << EOL
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db
EOL

# Crear archivo para la implementación fácil
echo "Generando script de post-despliegue..."
cat > deployment-package/post-deploy.sh << EOL
#!/bin/bash
# Script para configurar la aplicación después del despliegue

# Asegurarse de que los archivos clave son ejecutables
chmod +x fix-deployment.sh
chmod +x check-service.sh
chmod +x migrate.sh
chmod +x install-server.sh

# Ejecutar la corrección de despliegue
./fix-deployment.sh

echo "Configuración post-despliegue completada."
echo "La aplicación debería estar ejecutándose ahora."
echo "Verifica con: pm2 list"
EOL
chmod +x deployment-package/post-deploy.sh

# Crear archivo para generar un tarball
echo "Generando archivo comprimido..."
tar -czf presupuestos-deploy.tar.gz -C deployment-package .

echo "✅ Paquete de despliegue creado: presupuestos-deploy.tar.gz"
echo ""
echo "Para desplegar:"
echo "1. Sube el archivo al servidor:"
echo "   scp presupuestos-deploy.tar.gz baires@168.231.99.16:/home/baires/"
echo ""
echo "2. En el servidor, ejecuta:"
echo "   ssh baires@168.231.99.16"
echo "   cd /home/baires/apps/presupuestos"
echo "   tar -xzf /home/baires/presupuestos-deploy.tar.gz ."
echo "   ./post-deploy.sh"
echo ""
echo "La aplicación debería estar funcionando después de estos pasos."