'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chatWithDocuments(question: string) {
    const session = await auth();
    if (!session?.user) {
        return { error: 'Unauthorized' };
    }

    try {
        // 1. Generate Embedding for Question
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await embeddingModel.embedContent(question);
        const qEmbedding = result.embedding.values;

        // 2. Vector Search (Find relevant chunks for THIS user)
        // We join with Document to filter by userId
        const validDocs = await (prisma as any).document.findMany({
            where: { userId: session.user.id },
            select: { id: true }
        });

        if (validDocs.length === 0) {
            return { answer: "You haven't uploaded any documents yet." };
        }

        const validDocIds = validDocs.map((d: { id: string }) => d.id);

        // Raw query for vector similarity search
        // We cast to vector to ensure type safety in PG
        const chunks = await prisma.$queryRaw`
            WHERE "documentId" IN (${Prisma.join(validDocIds)})
            ORDER BY similarity DESC
            LIMIT 5;
        ` as { content: string, similarity: number }[];

        const context = chunks.map(c => c.content).join('\n---\n');

        // 3. Generate Answer with Groq
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI assistant. Use the following context to answer the user's question. 
                    If the answer is not in the context, say you don't know based on the documents.
                    
                    Context:
                    ${context}`
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            model: 'llama3-8b-8192', // Fast and effective
        });

        return { answer: completion.choices[0]?.message?.content || 'No answer generated.' };

    } catch (error) {
        console.error('Chat Error:', error);
        return { error: 'Failed to generate answer.' };
    }
}
