import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
    earlyAccess: true,
    migrations: {
        seed: 'npx tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL ?? '',
    },
});
