export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
}

export function getDatabaseConfig(
  env: Record<string, string | undefined> = process.env,
): DatabaseConfig {
  const portValue = env.DATABASE_PORT?.trim() || "5432";
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DATABASE_PORT must be an integer between 1 and 65535.");
  }

  return {
    host: env.DATABASE_HOST?.trim() || "127.0.0.1",
    port,
    database: env.DATABASE_NAME?.trim() || "inventorier",
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
  };
}

export function getDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const config = getDatabaseConfig(env);
  if (!config.user?.trim()) {
    throw new Error("DATABASE_USER is required.");
  }
  if (config.password === undefined) {
    throw new Error("DATABASE_PASSWORD is required.");
  }

  const url = new URL("postgresql://localhost");
  url.hostname = config.host;
  url.port = String(config.port);
  url.username = encodeURIComponent(config.user);
  url.password = encodeURIComponent(config.password);
  url.pathname = `/${encodeURIComponent(config.database)}`;
  url.searchParams.set("schema", "public");
  return url.toString();
}
