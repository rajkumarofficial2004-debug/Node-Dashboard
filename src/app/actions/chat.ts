'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import FirecrawlApp from '@mendable/firecrawl-js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

interface ChatResult {
    answer: string;
    sources?: string[];
    error?: string;
}

export async function chatWithDocuments(question: string, workspaceId?: string, deepSearch: boolean = false): Promise<ChatResult> {
    const session = await auth();
    if (!session?.user) {
        return { answer: '', error: 'Unauthorized' };
    }

    try {
        let context = '';
        let sources: string[] = [];

        // 1. Document RAG (Existing Logic)
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await embeddingModel.embedContent(question);
        const qEmbedding = result.embedding.values;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = { userId: session.user.id };
        if (workspaceId) {
            whereClause.workspaceId = workspaceId;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validDocs = await (prisma as any).document.findMany({
            where: whereClause,
            select: { id: true, title: true }
        });

        if (validDocs.length > 0) {
            const validDocIds = validDocs.map((d: { id: string }) => d.id);
            const docMap = new Map(validDocs.map((d: { id: string, title: string }) => [d.id, d.title]));

            const chunks = await prisma.$queryRaw`
                SELECT "content", "documentId", 1 - ("embedding" <=> ${qEmbedding}::vector) as similarity
                FROM "DocumentChunk"
                WHERE "documentId" IN (${Prisma.join(validDocIds)})
                ORDER BY similarity DESC
                LIMIT 5;
            ` as { content: string, documentId: string, similarity: number }[];

            if (chunks.length > 0) {
                context += "## Document Context:\n" + chunks.map(c => c.content).join('\n---\n') + "\n\n";
                const docSources = Array.from(new Set(chunks.map(c => docMap.get(c.documentId)))).filter(Boolean) as string[];
                sources = [...sources, ...docSources];
            }
        }

        // 2. Deep Search (New Logic)
        if (deepSearch) {
            if (!process.env.FIRECRAWL_API_KEY) {
                return { answer: '', error: 'Deep Search is enabled but API Key is missing.' };
            }

            try {
                const searchResponse = await firecrawl.search(question, {
                    scrapeOptions: {
                        formats: ['markdown']
                    }
                });

                if (searchResponse.web && searchResponse.web.length > 0) {
                    interface FirecrawlResult {
                        url: string;
                        title?: string;
                        markdown?: string;
                        content?: string;
                        description?: string;
                    }

                    const topResults = searchResponse.web.slice(0, 3) as FirecrawlResult[];
                    const webContext = topResults.map((r) => `Source: ${r.url}\nTitle: ${r.title || 'No Title'}\nContent: ${r.markdown || r.content || r.description || ''}`).join('\n---\n');

                    context += "## Web Search Context:\n" + webContext + "\n\n";
                    const webSources = topResults.map((r) => r.url);
                    sources = [...sources, ...webSources];
                }
            } catch (fcError) {
                console.error('Firecrawl Error:', fcError);
                // Continue without web results if search fails, but maybe note it?
                // For now, we'll just log it.
            }
        }

        if (!context.trim()) {
            return { answer: "I couldn't find any relevant information in your documents" + (deepSearch ? " or on the web." : "."), sources: [] };
        }

        // 3. Generate Answer
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful AI assistant. Use the provided context to answer the user's question. 
                    The context may contain information from user uploaded documents and/or web search results.
                    If the answer is not in the context, clearly state that you don't know based on the available information.
                    
                    Context:
                    ${context}`
                },
                {
                    role: 'user',
                    content: question
                }
            ],
            model: 'llama3-8b-8192',
        });

        return {
            answer: completion.choices[0]?.message?.content || 'No answer generated.',
            sources
        };

    } catch (error) {
        console.error('Chat Error:', error);
        return { answer: '', error: 'Failed to generate answer.' };
    }
}
