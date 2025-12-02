module.exports = {
  apps: [
    {
      name: 'dcoyver-web',
      script: 'npm',
      args: 'run server',
      cwd: '/home/bewrqarven/DcOyver/DcOyverWeb',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/home/bewrqarven/DcOyver/logs/web-error.log',
      out_file: '/home/bewrqarven/DcOyver/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}

