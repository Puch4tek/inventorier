export function databaseEnvironment(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    DATABASE_HOST: url.hostname,
    DATABASE_PORT: url.port || "5432",
    DATABASE_NAME: decodeURIComponent(url.pathname.slice(1)),
    DATABASE_USER: decodeURIComponent(url.username),
    DATABASE_PASSWORD: decodeURIComponent(url.password),
  };
}

export function setDatabaseEnvironment(databaseUrl, env = process.env) {
  Object.assign(env, databaseEnvironment(databaseUrl));
}
