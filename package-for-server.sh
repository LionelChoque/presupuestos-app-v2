#!/bin/bash
# Script para empaquetar todo y transferirlo al servidor

# Crear el tarball
echo "Creando archivo comprimido..."
cd production
tar -czf ../presupuestos-deploy.tar.gz .
cd ..

echo "===== Paquete creado: presupuestos-deploy.tar.gz ====="
echo ""
echo "Para transferir al servidor:"
echo "scp presupuestos-deploy.tar.gz baires@168.231.99.16:/home/baires/"
echo ""
echo "Para desplegar en el servidor:"
echo "ssh baires@168.231.99.16"
echo "cd /home/baires/apps/presupuestos"
echo "tar -xzf /home/baires/presupuestos-deploy.tar.gz ."
echo "chmod +x deploy.sh"
echo "./deploy.sh"
