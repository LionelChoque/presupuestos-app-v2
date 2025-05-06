module.exports = {
  apps: [{
    name: 'presupuestos-app',
    script: 'node index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db'
    },
    // Configuración para manejo de errores y tiempos de espera
    restart_delay: 4000,
    max_restarts: 10,
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};