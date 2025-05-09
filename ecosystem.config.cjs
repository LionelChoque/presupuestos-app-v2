module.exports = {
  apps: [{
    name: 'presupuestos-app',
    script: 'deploy-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://presupuestos_user:Baires2025@localhost:5432/presupuestos_db',
      SESSION_SECRET: 'presupuestos_secret_key_change_this_in_production',
      PUBLIC_PATH: '/var/www/presupuestos/dist/public'  // Añadir esta variable de entorno
    }
  }]
};
