'use client';

import { useState, useRef, useEffect } from 'react';
import { chatWithDocuments } from '@/app/actions/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatInterface({ workspaceId }: { workspaceId?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [deepSearch, setDeepSearch] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const result = await chatWithDocuments(userMessage, workspaceId, deepSearch);

            if (result.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }]);
            } else {
                let content = result.answer || 'No response.';
                if (result.sources && result.sources.length > 0) {
                    content += `\n\n**Sources:**\n${(result.sources as string[]).map(s => `- ${s}`).join('\n')}`;
                }
                setMessages(prev => [...prev, { role: 'assistant', content }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'An unexpected error occurred.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Ask Questions
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div
                    ref={scrollRef}
                    className="h-full overflow-y-auto p-4 space-y-4"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                            <Bot className="h-12 w-12 mb-4 opacity-50" />
                            <p>Ask questions about your uploaded documents!</p>
                            <p className="text-sm">&quot;Summarize the PDF I just uploaded&quot;</p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                            )}

                            <div className={`
                                max-w-[80%] rounded-lg px-4 py-2 text-sm
                                ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'}
                            `}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <User className="h-4 w-4 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-xs text-muted-foreground">{deepSearch ? 'Searching web & documents...' : 'Thinking...'}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 px-1">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            <input
                                type="checkbox"
                                checked={deepSearch}
                                onChange={(e) => setDeepSearch(e.target.checked)}
                                className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                                disabled={loading}
                            />
                            Deep Search (Web)
                        </label>
                    </div>
                    <div className="flex gap-2 w-full">
                        <Input
                            placeholder="Type your question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardFooter>
        </Card>
    );
}
