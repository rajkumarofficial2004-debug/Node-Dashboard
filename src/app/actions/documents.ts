'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// Polyfill for PDF Parse in Node environment
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

// @ts-ignore
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
}

const pdf = require('pdf-parse');
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function uploadDocument(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { error: 'No file provided' };
    }

    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        return { error: 'Only PDF and Text files are supported' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else {
            text = buffer.toString('utf-8');
        }

        if (!text.trim()) {
            return { error: 'Could not extract text from file.' };
        }

        // 1. Create Document Record
        const document = await (prisma as any).document.create({
            data: {
                title: file.name,
                type: file.type === 'application/pdf' ? 'PDF' : 'TEXT',
                userId: session.user.id,
                workspaceId: formData.get('workspaceId') as string || null,
            },
        });

        // 2. Chunk Text & Generate Embeddings
        const chunks = splitTextIntoChunks(text, 1000); // ~1000 chars per chunk
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        for (const chunk of chunks) {
            const result = await model.embedContent(chunk);
            const embedding = result.embedding.values;

            // Save chunk with embedding
            // Note: Prisma raw query is needed for pgvector until fully supported in typed client
            await prisma.$executeRaw`
                INSERT INTO "DocumentChunk" ("id", "content", "embedding", "documentId", "createdAt")
                VALUES (gen_random_uuid(), ${chunk}, ${embedding}::vector, ${document.id}, NOW());
            `;
        }

        revalidatePath('/dashboard/documents');
        return { success: true };

    } catch (error) {
        console.error('Upload Error:', error);
        return { error: 'Failed to process document.' };
    }
}

export async function getDocuments(workspaceId?: string) {
    const session = await auth();
    if (!session?.user) return [];

    const whereClause: any = { userId: session.user.id };
    if (workspaceId) {
        whereClause.workspaceId = workspaceId;
    }

    return await (prisma as any).document.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } }
    });
}

export async function deleteDocument(id: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    await (prisma as any).document.delete({
        where: { id, userId: session.user.id },
    });

    revalidatePath('/dashboard/documents');
    return { success: true };
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
}
