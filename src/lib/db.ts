import { Pool } from '@neondatabase/serverless';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let pool: Pool | null = null;

function resolveDatabaseUrl(): string | undefined {
  try {
    const env = getCloudflareContext().env as { DATABASE_URL?: string };
    if (env?.DATABASE_URL) return env.DATABASE_URL;
  } catch {
    // not in Cloudflare runtime — fall through to process.env
  }
  return process.env.DATABASE_URL;
}

export function getPool(): Pool {
  if (!pool) {
    const connectionString = resolveDatabaseUrl();
    pool = new Pool({ connectionString });
  }
  return pool;
}
