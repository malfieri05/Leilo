"use server";

import { revalidatePath } from "next/cache";
import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";

export type CompetitorState = { error?: string; added?: string };

export async function addCompetitorAction(_previous: CompetitorState, formData: FormData): Promise<CompetitorState> {
  const name = String(formData.get("name") ?? "").replace(/\s+/g, " ").trim();
  if (!name) return { error: "Enter a competitor name." };
  if (!hasDatabase()) return { error: "Database is not connected." };
  const sql = getSql();
  if (!sql) return { error: "Database is not connected." };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const existing = await sql.query(
      `SELECT name FROM lead_competitors WHERE organization_id = $1 AND lower(name) = lower($2) LIMIT 1`,
      [organizationId, name],
    );
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length > 0) return { error: `${name} is already on the list.` };
    await sql.query(`INSERT INTO lead_competitors (organization_id, name) VALUES ($1, $2)`, [organizationId, name]);
    revalidatePath("/leads");
    return { added: name };
  } catch (error) {
    return { error: publicError(error) };
  }
}
