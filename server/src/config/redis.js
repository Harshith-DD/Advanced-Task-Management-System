export function getRedisConnectionOptions({ worker = false } = {}) {
  const options = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  };

  if (process.env.REDIS_USERNAME) {
    options.username = process.env.REDIS_USERNAME;
  }

  if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD;
  }

  if (worker) {
    options.maxRetriesPerRequest = null;
  }

  return options;
}