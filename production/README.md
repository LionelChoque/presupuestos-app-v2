# Sistema de Seguimiento de Presupuestos - Despliegue en Producción

## Requisitos previos

- Node.js 18.x o superior
- PostgreSQL 12 o superior
- PM2 (instalado globalmente)
- Nginx

## Instalación

1. **Configurar la base de datos:**

```bash
# Crear base de datos y usuario
sudo -u postgres psql -c "CREATE DATABASE presupuestos_db;"
sudo -u postgres psql -c "CREATE USER presupuestos_user WITH ENCRYPTED PASSWORD 'tu_contraseña_segura';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE presupuestos_db TO presupuestos_user;"

# Importar esquema
sudo -u postgres psql presupuestos_db < db-setup.sql
```

2. **Actualizar credenciales:**

Edita los archivos `.env` y `ecosystem.config.cjs` para establecer la contraseña correcta de la base de datos.

3. **Desplegar la aplicación:**

```bash
# Instalar dependencias y construir la aplicación
./deploy.sh
```

4. **Configurar Nginx:**

```bash
# Copiar archivo de configuración
sudo cp nginx/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-available/

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/presupuestos.bairesanalitica.com.conf /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

5. **Configurar SSL (opcional pero recomendado):**

```bash
sudo certbot --nginx -d presupuestos.bairesanalitica.com
```

## Mantenimiento

Para tareas de mantenimiento, use el script `maintenance.sh`:

```bash
./maintenance.sh
```

Este script proporciona opciones para:

- Ver el estado de la aplicación
- Reiniciar la aplicación
- Ver logs
- Hacer backups de la base de datos
- Restaurar backups
- Reiniciar Nginx

## Solución de problemas

Si la aplicación no responde o muestra errores:

1. Verificar logs: `pm2 logs presupuestos-app`
2. Verificar estado: `pm2 list`
3. Reiniciar aplicación: `pm2 restart presupuestos-app`
4. Verificar conexión a base de datos: `psql -U presupuestos_user -h localhost -d presupuestos_db -c "SELECT 1;"`
