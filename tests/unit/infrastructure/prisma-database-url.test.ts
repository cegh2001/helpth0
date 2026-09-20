import { describe, expect, it } from 'vitest';
import { getPrismaDatabaseUrl } from '../../../prisma/database-url';

describe('Prisma database URL', () => {
  it('preserves the legacy schema-relative development database location', () => {
    expect(getPrismaDatabaseUrl('file:./dev.db')).toBe('file:./prisma/dev.db');
  });

  it('preserves the legacy schema-relative test database location', () => {
    expect(getPrismaDatabaseUrl('file:./test.db')).toBe('file:./prisma/test.db');
  });

  it('does not rewrite an already rooted or absolute database URL', () => {
    expect(getPrismaDatabaseUrl('file:./prisma/dev.db')).toBe('file:./prisma/dev.db');
    expect(getPrismaDatabaseUrl('file:C:/data/helpth0.db')).toBe('file:C:/data/helpth0.db');
  });
});