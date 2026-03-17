import { Client } from 'pg';
import { pathToFileURL } from 'node:url';

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Set DATABASE_URL env var to your Postgres connection string');
  }
  return connectionString;
}

export async function fetchUsers(limit = 50) {
  const client = new Client({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM auth.users LIMIT $1;', [limit]);
    return rows;
  } finally {
    await client.end();
  }
}

async function main() {
  const rows = await fetchUsers();
  console.table(rows);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Query failed:', err);
    process.exit(1);
  });
}
