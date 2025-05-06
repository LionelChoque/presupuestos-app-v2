module.exports = {
  apps: [{
    name: 'presupuestos-app',
    script: 'node_modules/tsx/dist/cli.mjs',
    args: 'server/index.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://presupuestos_user:CHANGE_THIS_PASSWORD@localhost:5432/presupuestos_db'
    }
  }]
};