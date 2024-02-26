module.exports = {
  apps: [
    {
      name: 'todo-app',
      script: 'index.js',
      instances: 'max',
      exec_mode: 'cluster',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: './pm2logs/error.log',
      out_file: './pm2logs/out.log',
      merge_logs: true,
    },
  ],
};
