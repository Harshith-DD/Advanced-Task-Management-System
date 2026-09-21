const requiredVariables = [
  "PORT",
  "MONGODB_URI",
  "CORS_ORIGIN",
  "JWT_SECRET",
  "REDIS_HOST",
  "REDIS_PORT",
];

export function validateEnvironment() {
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name] || !process.env[name].trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const port = Number(process.env.PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid number between 1 and 65535");
  }

  const redisPort = Number(process.env.REDIS_PORT);

  if (!Number.isInteger(redisPort) || redisPort < 1 || redisPort > 65535) {
    throw new Error(
      "REDIS_PORT must be a valid number between 1 and 65535",
    );
  }

  if (
    process.env.COOKIE_SECURE !== undefined &&
    process.env.COOKIE_SECURE !== "" &&
    !["true", "false"].includes(process.env.COOKIE_SECURE.toLowerCase())
  ) {
    throw new Error("COOKIE_SECURE must be either true or false");
  }
}