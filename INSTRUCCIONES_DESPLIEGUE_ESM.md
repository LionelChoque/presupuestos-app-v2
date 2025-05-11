# Instrucciones para Despliegue en Producción con ESM

Este documento proporciona instrucciones detalladas para implementar el proyecto en producción utilizando ESM (ECMAScript Modules) en lugar de CommonJS.

## 1. Modificaciones al `package.json`

Añade los siguientes scripts al archivo `package.json`:

```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "build:esm": "bash build-esm.sh",
  "build:cjs": "bash build-commonjs.sh",
  "start": "NODE_ENV=production node dist/index.js",
  "start:esm": "NODE_ENV=production node --experimental-specifier-resolution=node dist/server.js",
  "start:pm2": "pm2 start ecosystem.config.js",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}
```

## 2. Proceso de Construcción y Despliegue con ESM

Después de realizar los cambios y crear los archivos necesarios (`build-esm.sh` y `ecosystem.config.esm.js`), sigue estos pasos para construir y desplegar la aplicación:

### En tu entorno de desarrollo:

1. Ejecuta el script de construcción ESM:
   ```
   npm run build:esm
   ```

2. El script generará un archivo `presupuestos-deploy-esm.tar.gz` que contiene la versión de producción de la aplicación.

### En el servidor de producción:

1. Transfiere el archivo `presupuestos-deploy-esm.tar.gz` al servidor:
   ```
   scp presupuestos-deploy-esm.tar.gz usuario@servidor:/ruta/destino/
   ```

2. Conéctate al servidor y extrae el archivo:
   ```
   ssh usuario@servidor
   cd /ruta/destino/
   tar -xzf presupuestos-deploy-esm.tar.gz
   ```

3. Instala las dependencias de producción:
   ```
   npm ci --production
   ```

4. Asegúrate de que tienes PM2 instalado con soporte para ESM:
   ```
   npm install -g pm2
   pm2 install pm2-logrotate
   ```

5. Inicia la aplicación con PM2:
   ```
   pm2 start ecosystem.config.js
   ```

6. Configura PM2 para iniciar automáticamente con el sistema:
   ```
   pm2 startup
   pm2 save
   ```

## 3. Configuración de Nginx

Si estás utilizando Nginx como proxy inverso, asegúrate de configurarlo correctamente:

```nginx
server {
    listen 80;
    server_name presupuestos.bairesanalitica.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Configuración de Certificado SSL con Let's Encrypt

Para habilitar HTTPS:

```
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d presupuestos.bairesanalitica.com
```

## 5. Variables de Entorno en Producción

Asegúrate de configurar correctamente las variables de entorno en el servidor de producción. Puedes hacerlo editando el archivo `ecosystem.config.js` o creando un archivo `.env` en el servidor:

```
DATABASE_URL=postgresql://presupuestos_user:contraseña@localhost:5432/presupuestos_db
NODE_ENV=production
PORT=5000
SESSION_SECRET=un_valor_secreto_seguro_y_complejo
```

## 6. Monitorización y Logs

Para monitorear la aplicación:
```
pm2 monit
```

Para ver los logs:
```
pm2 logs
```

## 7. Rollback en caso de problemas

Si encuentras problemas con la versión ESM, puedes volver a la versión CommonJS:

1. Construye la versión CommonJS:
   ```
   npm run build:cjs
   ```

2. Transfiere y despliega el archivo resultante como se describe anteriormente.

## Consideraciones especiales

- **Resolución de Módulos**: Node.js con ESM requiere la bandera `--experimental-specifier-resolution=node` para manejar las importaciones sin extensiones.
- **Compatibilidad**: Asegúrate de que todas las dependencias sean compatibles con ESM.
- **Actualización de PM2**: Asegúrate de usar una versión reciente de PM2 que tenga buen soporte para ESM.
- **Supervisión de memoria**: Configura alertas en PM2 para monitorear el uso de memoria y evitar problemas de rendimiento.