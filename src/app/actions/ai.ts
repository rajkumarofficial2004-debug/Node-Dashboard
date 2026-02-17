'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { YoutubeTranscript } from 'youtube-transcript';
import { auth } from '@/auth';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function generateStudyNotes(videoUrl: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    if (!process.env.GOOGLE_API_KEY) {
        return { error: 'API Key not configured' };
    }

    try {
        // 1. Validate URL and extract Video ID
        const videoIdMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

        if (!videoIdMatch?.[1]) {
            return { error: 'Invalid YouTube URL' };
        }

        const videoId = videoIdMatch[1];

        // 2. Fetch Transcript
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId).catch(() => null);

        if (!transcriptItems) {
            return { error: 'Could not retrieve transcript. The video might not have captions.' };
        }

        const transcriptText = transcriptItems.map(item => item.text).join(' ');

        // 3. Generate Summary with Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
        You are an expert tutor. I will provide a transcript of a YouTube video. 
        Your task is to create clear, structured study notes from it.
        
        Use the following format:
        # [Video Title Placeholder - You create a title based on content]
        
        ## Summary
        [Brief summary of the video's main topic]
        
        ## Key Concepts
        - **[Concept 1]**: [Explanation]
        - **[Concept 2]**: [Explanation]
        
        ## Detailed Notes
        [Bulleted list or paragraphs as appropriate]
        
        ## Quiz (3 Questions)
        1. [Question]
           - [ ] Option A
           - [ ] Option B
           - [x] Option C (Mark correct answer roughly like this or just list it)
        
        TRANSCRIPT:
        ${transcriptText.substring(0, 30000)} // Truncate to avoid token limits if extremely long
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { notes: text };

    } catch (error) {
        console.error('AI Study Notes Error:', error);
        return { error: 'Failed to generate notes. Please try again later.' };
    }
}
