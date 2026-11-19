import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { schemaStatements } from "@/lib/db/schema";

export type Sql = NeonQueryFunction<false, false>;

let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

function migrationSql() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (/postgres(ql)?:\/\//i.test(message) || /password authentication/i.test(message)) {
    return "The database connection failed.";
  }
  return message.slice(0, 400);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = applySchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function applySchema() {
  const sql = migrationSql();
  if (!sql) return;
  for (const statement of schemaStatements) {
    try {
      await sql.query(statement);
    } catch (error) {
      const text = error instanceof Error ? error.message : "";
      const extension = statement.includes("CREATE EXTENSION");
      if (extension && /already exists|permission denied/i.test(text)) continue;
      throw error;
    }
  }
}

export async function leiloOrganizationId(sql: Sql) {
  await ensureSchema();
  const rows = await sql`SELECT id FROM organizations WHERE name = 'Leilo' LIMIT 1`;
  const id = rows[0]?.id;
  if (typeof id !== "string") {
    throw new Error("The Leilo organization row is missing.");
  }
  return id;
}
