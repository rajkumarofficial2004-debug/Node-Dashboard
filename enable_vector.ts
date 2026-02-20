import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log("Creating vector extension...");
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
        console.log("Extension created!");
    } catch (error) {
        console.error("Error creating extension:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
