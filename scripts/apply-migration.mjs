/**
 * Script temporaire pour appliquer la migration init via postgres.js
 * Contournement du problème DNS local (Prisma CLI ne peut pas résoudre Supabase)
 * Usage: node --env-file=.env scripts/apply-migration.mjs
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Remplace le hostname par l'IP résolue via 8.8.8.8 (DNS local défaillant)
const url = process.env.DATABASE_URL.replace(
  "aws-1-us-east-1.pooler.supabase.com",
  "3.227.209.82"
);

const sql = postgres(url, {
  ssl: {
    rejectUnauthorized: false,
    servername: "aws-1-us-east-1.pooler.supabase.com",
  },
  connect_timeout: 15,
  max: 1,
});

async function run() {
  try {
    console.log("Connexion à Supabase...");
    await sql`SELECT 1`;
    console.log("Connecté.");

    // Vérifie si les tables existent déjà
    const existing = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('pathologies', 'phases', 'exercises', 'protocols', 'protocol_exercises')
    `;

    if (existing.length > 0) {
      console.log(
        "Tables déjà présentes:",
        existing.map((r) => r.table_name).join(", ")
      );
      console.log("Migration déjà appliquée. Enregistrement dans _prisma_migrations...");
    } else {
      // Lit et applique le SQL de migration
      const migrationSql = readFileSync(
        join(
          projectRoot,
          "prisma/migrations/20260326000000_init/migration.sql"
        ),
        "utf8"
      );
      console.log("Application de la migration SQL...");
      await sql.unsafe(migrationSql);
      console.log("Migration SQL appliquée avec succès.");
    }

    // Crée la table _prisma_migrations si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
      )
    `;

    // Vérifie si la migration est déjà enregistrée
    const alreadyRecorded = await sql`
      SELECT id FROM "_prisma_migrations"
      WHERE migration_name = '20260326000000_init'
    `;

    if (alreadyRecorded.length === 0) {
      await sql`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          'manual-apply',
          NOW(),
          '20260326000000_init',
          1
        )
      `;
      console.log("Migration enregistrée dans _prisma_migrations.");
    } else {
      console.log("Migration déjà enregistrée dans _prisma_migrations.");
    }

    // Vérifie les tables créées
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(
      "Tables dans public:",
      tables.map((r) => r.table_name).join(", ")
    );

    await sql.end();
    console.log("Terminé avec succès.");
    process.exit(0);
  } catch (err) {
    console.error("ERREUR:", err.message);
    await sql.end();
    process.exit(1);
  }
}

run();
