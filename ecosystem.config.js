module.exports = {
  apps: [
    {
      name: 'twikk',
      script: './app.js',
      cwd: '/root/Twikk',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
        HTTPS: 'true',
        PROD_HOST: 'twikk.hezhili.online'
      },
      error_file: '/root/Twikk/logs/twikk-error.log',
      out_file: '/root/Twikk/logs/twikk-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
}
