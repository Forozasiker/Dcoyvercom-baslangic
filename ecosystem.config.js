module.exports = {
  apps: [
    {
      name: 'dcoyver-bot',
      script: 'node',
      args: '.',
      cwd: './DcOyver',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4096M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../logs/bot-error.log',
      out_file: '../logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'dcoyver-web',
      script: 'sudo',
      args: 'npm run dev',
      cwd: './DcOyverWeb',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4096M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      error_file: '../logs/web-error.log',
      out_file: '../logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};

