import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function main() {
    try {
        console.log("Finding user...");
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found.");
            return;
        }

        console.log("Creating document...");
        const document = await prisma.document.create({
            data: {
                title: "Test Full Upload",
                type: "TEXT",
                userId: user.id,
            }
        });

        console.log("Chunking text...");
        const chunk = "Test chunk for embeddings.";

        console.log("Generating embedding...");
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent(chunk);
        const embedding = result.embedding.values;

        const embeddingString = `[${embedding.join(',')}]`;

        console.log("Inserting chunk into DB (actual query)...");
        await prisma.$executeRaw`
            INSERT INTO "DocumentChunk" ("id", "content", "embedding", "documentId", "createdAt")
            VALUES (gen_random_uuid(), ${chunk}, ${embeddingString}::vector, ${document.id}, NOW());
        `;
        console.log("DB Insert passed!");

        // Cleanup
        await prisma.document.delete({ where: { id: document.id } });
        console.log("Cleanup finished successfully.");
    } catch (error) {
        console.error("Script Error:", error.message, error.stack);
        require('fs').writeFileSync('clean_error.txt', error.stack || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
