module.exports = {
  apps: [
    {
      name: "safedrive-socket",
      script: "./server/socketServer.ts",
      interpreter: "ts-node",

      instances: 1, // IMPORTANT: socket state is in-memory → do NOT scale horizontally yet
      exec_mode: "fork",

      watch: false,

      max_memory_restart: "400M",

      env: {
        NODE_ENV: "production",
        SOCKET_PORT: 4001,
      },

      error_file: "./logs/socket-error.log",
      out_file: "./logs/socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
