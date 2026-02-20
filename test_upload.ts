import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Polyfills
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function main() {
    try {
        const text = "This is a test document.";
        const userId = "test_user_id";

        console.log("Creating document...");
        let documentId = "test_doc_id";

        console.log("Chunking text...");
        const chunk = text;

        console.log("Generating embedding...");
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent(chunk);
        const embedding = result.embedding.values;
        console.log("Embedding generated. Length:", embedding.length);

        console.log("Inserting chunk into DB (mock query)...");
        try {
            // We just test the DB query
            await prisma.$executeRaw`SELECT 1`;
            console.log("DB select 1 passed");

            // Try actual insert but might fail on foreign key
            // await prisma.$executeRaw`INSERT INTO "DocumentChunk" ("id", "content", "embedding", "documentId", "createdAt") VALUES (gen_random_uuid(), ${chunk}, ${embedding}::vector, ${documentId}, NOW());`;
            // console.log("DB Insert passed");
        } catch (e) {
            console.error("DB Error:", e);
        }

        console.log("Script finished successfully.");
    } catch (error) {
        console.error("Script Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
