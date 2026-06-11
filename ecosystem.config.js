module.exports = {
  apps: [
    {
      name: "safedrive-socket",
      script: "./server/index.js",

      instances: 1,
      exec_mode: "fork",

      watch: false,

      max_memory_restart: "500M",

      env: {
        NODE_ENV: "production",
        PORT: 4001,
      },

      error_file: "./logs/socket-error.log",
      out_file: "./logs/socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
