const DEFAULT_DATABASE_URL = 'file:./prisma/dev.db';

export function getPrismaDatabaseUrl(value = process.env.DATABASE_URL): string {
  if (!value) return DEFAULT_DATABASE_URL;

  const legacyRelativeFile = value.match(/^file:\.\/([^/\\]+)$/);
  return legacyRelativeFile
    ? `file:./prisma/${legacyRelativeFile[1]}`
    : value;
}