module.exports = {
  apps: [
    {
      name: "chatcore",
      script: "npm",
      args: "run start:cron",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
