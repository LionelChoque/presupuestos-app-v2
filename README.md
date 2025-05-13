# Sistema de Seguimiento de Presupuestos

Este proyecto proporciona una plataforma para el seguimiento, análisis y gestión de presupuestos comerciales.

## Características principales

- Importación de datos de presupuestos desde archivos CSV
- Seguimiento del estado de los presupuestos
- Visualización de datos mediante gráficos y reportes
- Gestión de tareas de seguimiento
- Almacenamiento de información de contacto para cada presupuesto
- Sistema de autenticación y autorización de usuarios
- Indicadores de desempeño para usuarios
- Sistema de insignias por logros
- Seguimiento histórico de estados de presupuestos
- Generación y exportación de reportes en múltiples formatos
- Menú lateral colapsable para mayor espacio en pantalla

## Tecnologías utilizadas

- **Frontend**: React con TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js con TypeScript
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: Passport.js
- **Gráficos**: Recharts, Chart.js
- **Exportación**: PDFKit, XLSX
- **Módulos**: ESM (ECMAScript Modules)

## Requisitos previos

- Node.js (versión 18+)
- PostgreSQL (versión 14+)

## Instalación y configuración

1. Clona este repositorio
2. Instala las dependencias:
   ```
   npm install
   ```
3. Configura las variables de entorno en un archivo `.env`:
   ```
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_db
   PORT=5000
   SESSION_SECRET=un_valor_secreto_seguro_y_complejo
   ```
4. Inicializa la base de datos:
   ```
   npm run db:push
   ```
5. Inicia la aplicación en modo desarrollo:
   ```
   npm run dev
   ```

## Despliegue en producción

### Preparación

1. Construye la aplicación para producción:
   ```
   ./build.sh
   ```

2. Inicia la aplicación en producción:
   ```
   NODE_ENV=production node --experimental-specifier-resolution=node dist/index.js
   ```

### Configuración con PM2

Para ejecutar la aplicación con PM2, puedes usar un archivo de configuración como este:

```javascript
export default {
  apps: [{
    name: 'presupuestos-app',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://usuario:contraseña@localhost:5432/nombre_db',
      SESSION_SECRET: 'un_valor_secreto_seguro_y_complejo'
    },
    node_args: '--experimental-specifier-resolution=node'
  }]
};
```

## Estructura del proyecto

- `/client`: Código del frontend
- `/server`: Código del backend
- `/shared`: Tipos y utilidades compartidas
- `/nginx`: Configuración del servidor web

## Licencia

MIT