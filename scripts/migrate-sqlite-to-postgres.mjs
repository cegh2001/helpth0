import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const backupPath = path.resolve(process.cwd(), 'prisma', 'sqlite-backup.json');

if (!fs.existsSync(backupPath)) {
  console.error(`Backup file not found at ${backupPath}`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString || (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://'))) {
  console.error('DATABASE_URL must be a valid postgresql:// connection string');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const pool = new Pool({ connectionString });

async function main() {
  console.log('Connecting to Neon PostgreSQL...');

  // 1. Users
  for (const user of backup.user || []) {
    await pool.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name"`,
      [
        user.id,
        user.name,
        user.email,
        Boolean(user.emailVerified),
        user.image,
        new Date(user.createdAt),
        new Date(user.updatedAt),
      ]
    );
    console.log(`User synced: ${user.email}`);
  }

  // 2. Accounts
  for (const acc of backup.account || []) {
    await pool.query(
      `INSERT INTO "account" ("id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT ("id") DO NOTHING`,
      [
        acc.id,
        acc.accountId,
        acc.providerId,
        acc.userId,
        acc.accessToken,
        acc.refreshToken,
        acc.idToken,
        acc.accessTokenExpiresAt ? new Date(acc.accessTokenExpiresAt) : null,
        acc.refreshTokenExpiresAt ? new Date(acc.refreshTokenExpiresAt) : null,
        acc.scope,
        acc.password,
        new Date(acc.createdAt),
        new Date(acc.updatedAt),
      ]
    );
    console.log(`Account synced: ${acc.id}`);
  }

  // 3. Doctors
  for (const doc of backup.Doctor || []) {
    await pool.query(
      `INSERT INTO "Doctor" ("id", "name", "specialty", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name"`,
      [
        doc.id,
        doc.name,
        doc.specialty,
        Boolean(doc.isActive),
        new Date(doc.createdAt),
        new Date(doc.updatedAt),
      ]
    );
    console.log(`Doctor synced: ${doc.name}`);
  }

  // 4. Schedules
  for (const sch of backup.Schedule || []) {
    await pool.query(
      `INSERT INTO "Schedule" ("id", "doctorId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("id") DO NOTHING`,
      [
        sch.id,
        sch.doctorId,
        sch.dayOfWeek,
        sch.startTime,
        sch.endTime,
        new Date(sch.createdAt),
        new Date(sch.updatedAt),
      ]
    );
    console.log(`Schedule synced: ${sch.id}`);
  }

  // 5. DailyCounts
  for (const count of backup.DailyCount || []) {
    await pool.query(
      `INSERT INTO "DailyCount" ("id", "doctorId", "scheduleId", "slotKey", "scheduleSnapshotStart", "scheduleSnapshotEnd", "date", "patientCount", "notes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT ("id") DO NOTHING`,
      [
        count.id,
        count.doctorId,
        count.scheduleId,
        count.slotKey ?? '',
        count.scheduleSnapshotStart,
        count.scheduleSnapshotEnd,
        count.date,
        count.patientCount,
        count.notes,
        new Date(count.createdAt),
        new Date(count.updatedAt),
      ]
    );
    console.log(`DailyCount synced: ${count.id}`);
  }

  console.log('Data migration to Neon completed successfully!');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
