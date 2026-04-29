import { defineConfig, env } from 'prisma/config';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
