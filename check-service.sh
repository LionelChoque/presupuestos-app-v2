#!/bin/bash

# Script para verificar el estado de los servicios y solucionar problemas comunes

echo "========== Verificando estado de los servicios =========="

# Verificar estado de PostgreSQL
echo -e "\n[+] Estado de PostgreSQL:"
sudo systemctl status postgresql | grep -E "Active:|running"

# Verificar que la base de datos existe
echo -e "\n[+] Verificando base de datos:"
sudo -u postgres psql -lqt | grep presupuestos_db

# Verificar estado de Nginx
echo -e "\n[+] Estado de Nginx:"
sudo systemctl status nginx | grep -E "Active:|running"
echo -e "\nConfiguración de Nginx:"
sudo nginx -t

# Verificar estado de PM2
echo -e "\n[+] Estado de PM2:"
pm2 list

# Verificar puertos en uso
echo -e "\n[+] Puertos en uso:"
sudo netstat -tulpn | grep -E "nginx|node|:5000|:80"

# Verificar logs recientes
echo -e "\n[+] Últimas líneas de log de Nginx:"
sudo tail -n 10 /var/log/nginx/presupuestos.error.log

echo -e "\n[+] Últimas líneas de log de la aplicación:"
pm2 logs presupuestos-app --lines 10

echo -e "\n========== Fin de la verificación =========="

# Opciones para solucionar problemas
echo -e "\n¿Desea intentar solucionar los problemas detectados? (s/n)"
read respuesta

if [ "$respuesta" = "s" ]; then
    echo "Reiniciando servicios..."
    sudo systemctl restart postgresql
    sudo systemctl restart nginx
    pm2 restart presupuestos-app
    
    echo "Verificando nuevamente..."
    sleep 3
    
    if pm2 status | grep -q "online"; then
        echo "✅ Servicio reiniciado correctamente"
    else
        echo "❌ Aún hay problemas con el servicio"
        echo "Recomendaciones:"
        echo "1. Verificar logs completos: pm2 logs presupuestos-app"
        echo "2. Verificar conexión a base de datos"
        echo "3. Revisar configuración en ecosystem.config.js"
    fi
else
    echo "No se realizaron cambios"
fi