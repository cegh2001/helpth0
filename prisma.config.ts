import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { getPrismaDatabaseUrl } from './prisma/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: getPrismaDatabaseUrl(),
  },
});