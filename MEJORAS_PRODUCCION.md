# Mejoras para Despliegue en Producción

## Problemas Identificados y Soluciones Implementadas

### 1. Incompatibilidad de TypeScript en Producción

**Problemas:**
- El código TypeScript necesitaba ser transpilado correctamente a JavaScript para entornos de producción
- Las importaciones entre archivos necesitaban actualización (.ts → .js)
- La configuración original de TypeScript estaba optimizada para desarrollo, no para producción

**Soluciones:**
- Creado archivo `tsconfig.prod.json` específico para producción
- Configurado para generar código JavaScript en una estructura coherente
- Implementado proceso automático para corregir rutas de importación

### 2. Manejo Inconsistente de Módulos

**Problemas:**
- Conflictos entre CommonJS y ES Modules
- Problemas con las rutas de importación relativas y alias como `@shared/*`

**Soluciones:**
- Configuración uniforme para usar ES Modules 
- Script automatizado para transformar importaciones
- Punto de entrada optimizado para producción (`deploy-server.js`)

### 3. Estructura de Directorios y Compilación

**Problemas:**
- Estructura inadecuada para producción
- Dificultad para mantener las importaciones relativas

**Soluciones:**
- Nuevo proceso de construcción que mantiene estructura coherente
- Separación clara entre archivos cliente y servidor
- Organización optimizada para despliegue

### 4. Configuración de Base de Datos

**Problemas:**
- Problemas al conectar con PostgreSQL en producción
- Falta de scripts para configuración inicial

**Soluciones:**
- Scripts de configuración de base de datos mejorados
- Proceso claro para migración y configuración inicial
- Manejo adecuado de parámetros de conexión

### 5. Servir el Frontend

**Problemas:**
- Dificultad para servir correctamente el frontend desde Express
- Manejo inadecuado de rutas SPA

**Soluciones:**
- Configuración optimizada en el servidor para archivos estáticos
- Manejo correcto de rutas para SPA
- Integración adecuada con Nginx

## Nuevos Scripts y Herramientas

### build-prod.sh
Script completo de construcción para producción que:
- Transpila TypeScript a JavaScript
- Corrige las importaciones
- Genera los archivos de configuración necesarios
- Organiza todo en una estructura optimizada para despliegue

### deploy-to-vps.sh
Script para automatizar el despliegue al VPS:
- Construye la aplicación
- Transfiere los archivos al servidor
- Configura el entorno en el servidor

### deploy-server.js
Punto de entrada optimizado para producción:
- Maneja correctamente las importaciones
- Configura adecuadamente Express
- Proporciona manejo de errores mejorado

### Otros Scripts Útiles
- `migrate.sh`: Para ejecutar migraciones en producción
- `import-data.sh`: Para importar datos CSV iniciales
- `install.sh`: Para configurar el servidor

## Instrucciones de Uso

1. Para construir la aplicación para producción:
   ```
   ./build-prod.sh
   ```

2. Para desplegar al VPS directamente:
   ```
   ./deploy-to-vps.sh baires 168.231.99.16 /home/baires/apps/presupuestos
   ```

3. Para desplegar manualmente:
   - Construir con `./build-prod.sh`
   - Transferir contenido de `dist/` al servidor
   - Seguir instrucciones en README.md dentro de la carpeta dist

## Recomendaciones Adicionales

1. **Monitoreo:** Configurar herramientas de monitoreo como PM2 Plus o Grafana
2. **Backups automáticos:** Implementar respaldos automatizados de la base de datos
3. **CI/CD:** Considerar implementar un pipeline de integración continua
4. **Pruebas:** Agregar pruebas automatizadas antes del despliegue
5. **Logs:** Implementar rotación de logs y almacenamiento centralizado