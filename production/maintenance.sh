#!/bin/bash
# Script de mantenimiento para la aplicación

function show_menu {
  clear
  echo "===== MANTENIMIENTO DE PRESUPUESTOS APP ====="
  echo "1. Ver estado de la aplicación"
  echo "2. Reiniciar aplicación"
  echo "3. Ver logs de la aplicación"
  echo "4. Ver configuración actual"
  echo "5. Hacer backup de la base de datos"
  echo "6. Restaurar backup de la base de datos"
  echo "7. Reiniciar Nginx"
  echo "8. Salir"
  echo "==========================================="
  echo -n "Selecciona una opción: "
}

function view_status {
  echo "Estado de PM2:"
  pm2 list
  echo ""
  echo "Estado de PostgreSQL:"
  sudo systemctl status postgresql | head -n 10
  echo ""
  echo "Estado de Nginx:"
  sudo systemctl status nginx | head -n 10
  echo ""
  echo "Uso de disco:"
  df -h | grep "/dev/sd"
  echo ""
  echo "Puertos en uso:"
  netstat -tulpn | grep -E ':80|:5000'
  echo ""
  read -p "Presiona Enter para continuar..."
}

function restart_app {
  echo "Reiniciando aplicación..."
  pm2 restart presupuestos-app
  echo "Aplicación reiniciada."
  read -p "Presiona Enter para continuar..."
}

function view_logs {
  echo "Mostrando logs de la aplicación..."
  pm2 logs presupuestos-app --lines 50
  read -p "Presiona Enter para continuar..."
}

function view_config {
  echo "Configuración actual:"
  echo ""
  echo "Archivo .env:"
  cat .env
  echo ""
  echo "Configuración de PM2:"
  cat ecosystem.config.cjs
  echo ""
  echo "Configuración de Nginx:"
  cat nginx/presupuestos.bairesanalitica.com.conf
  echo ""
  read -p "Presiona Enter para continuar..."
}

function backup_db {
  BACKUP_DIR="./backups"
  mkdir -p $BACKUP_DIR
  FILENAME="presupuestos_$(date +%Y%m%d_%H%M%S).dump"
  echo "Creando backup de la base de datos: $FILENAME"
  pg_dump -U presupuestos_user -h localhost -d presupuestos_db -F c -f "$BACKUP_DIR/$FILENAME"
  if [ $? -eq 0 ]; then
    echo "Backup creado exitosamente en $BACKUP_DIR/$FILENAME"
  else
    echo "Error al crear el backup"
  fi
  read -p "Presiona Enter para continuar..."
}

function restore_db {
  BACKUP_DIR="./backups"
  if [ ! -d "$BACKUP_DIR" ]; then
    echo "No se encontró el directorio de backups"
    read -p "Presiona Enter para continuar..."
    return
  fi
  
  echo "Archivos de backup disponibles:"
  ls -lh $BACKUP_DIR
  echo ""
  read -p "Ingresa el nombre del archivo de backup a restaurar: " FILENAME
  
  if [ ! -f "$BACKUP_DIR/$FILENAME" ]; then
    echo "El archivo $BACKUP_DIR/$FILENAME no existe"
    read -p "Presiona Enter para continuar..."
    return
  fi
  
  echo "¡ADVERTENCIA! Esto sobrescribirá la base de datos actual."
  read -p "¿Estás seguro de que deseas continuar? (s/n): " CONFIRM
  
  if [ "$CONFIRM" == "s" ]; then
    echo "Restaurando backup..."
    pg_restore -U presupuestos_user -h localhost -d presupuestos_db -c -F c "$BACKUP_DIR/$FILENAME"
    if [ $? -eq 0 ]; then
      echo "Backup restaurado exitosamente"
    else
      echo "Error al restaurar el backup"
    fi
  else
    echo "Operación cancelada"
  fi
  
  read -p "Presiona Enter para continuar..."
}

function restart_nginx {
  echo "Verificando configuración de Nginx..."
  sudo nginx -t
  if [ $? -eq 0 ]; then
    echo "Reiniciando Nginx..."
    sudo systemctl restart nginx
    echo "Nginx reiniciado."
  else
    echo "Error en la configuración de Nginx. No se reinició."
  fi
  read -p "Presiona Enter para continuar..."
}

# Menú principal
while true; do
  show_menu
  read OPTION
  
  case $OPTION in
    1) view_status ;;
    2) restart_app ;;
    3) view_logs ;;
    4) view_config ;;
    5) backup_db ;;
    6) restore_db ;;
    7) restart_nginx ;;
    8) break ;;
    *) echo "Opción inválida" ;;
  esac
done

echo "Saliendo del programa de mantenimiento"
exit 0
