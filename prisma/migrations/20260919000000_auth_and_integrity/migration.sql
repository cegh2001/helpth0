PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Rebuild DailyCount with stable slot keys and immutable schedule snapshots.
CREATE TABLE "new_DailyCount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "slotKey" TEXT NOT NULL DEFAULT '',
    "scheduleSnapshotStart" TEXT,
    "scheduleSnapshotEnd" TEXT,
    "date" TEXT NOT NULL,
    "patientCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCount_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyCount_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_DailyCount" (
    "id",
    "doctorId",
    "scheduleId",
    "slotKey",
    "scheduleSnapshotStart",
    "scheduleSnapshotEnd",
    "date",
    "patientCount",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    ranked."id",
    ranked."doctorId",
    ranked."scheduleId",
    CASE
        WHEN ranked."scheduleId" IS NOT NULL THEN ranked."scheduleId"
        WHEN ranked."legacyRank" = 1 THEN ''
        ELSE 'legacy:' || ranked."id"
    END,
    schedule."startTime",
    schedule."endTime",
    ranked."date",
    ranked."patientCount",
    ranked."notes",
    ranked."createdAt",
    ranked."updatedAt"
FROM (
    SELECT
        dailyCount.*,
        ROW_NUMBER() OVER (
            PARTITION BY dailyCount."doctorId", dailyCount."date", dailyCount."scheduleId"
            ORDER BY dailyCount."createdAt", dailyCount."id"
        ) AS "legacyRank"
    FROM "DailyCount" AS dailyCount
) AS ranked
LEFT JOIN "Schedule" AS schedule ON schedule."id" = ranked."scheduleId";

DROP TABLE "DailyCount";
ALTER TABLE "new_DailyCount" RENAME TO "DailyCount";

CREATE UNIQUE INDEX "DailyCount_doctorId_date_slotKey_key" ON "DailyCount"("doctorId", "date", "slotKey");
CREATE INDEX "DailyCount_date_idx" ON "DailyCount"("date");
CREATE INDEX "DailyCount_doctorId_idx" ON "DailyCount"("doctorId");
CREATE INDEX "DailyCount_scheduleId_idx" ON "DailyCount"("scheduleId");

-- Better Auth tables.
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;